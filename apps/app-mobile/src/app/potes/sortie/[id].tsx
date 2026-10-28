import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import { choisirLieuGagnant } from "@sos-miam/commun/fonctions/sorties/choisir-lieu-gagnant";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { DiscussionSortie, type LigneDiscussion } from "~/composants/potes/DiscussionSortie";
import { EnTeteSortie } from "~/composants/potes/EnTeteSortie";
import { MembresSortie } from "~/composants/potes/MembresSortie";
import { VoteSortie } from "~/composants/potes/VoteSortie";
import { TEXTES_ECRAN_SORTIE_POTES, TEXTES_ECRAN_SORTIE_POTES_PAR_LANGUE } from "~/contenus/textes-ecran-sortie-potes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserDiscussionSortie } from "~/hooks/utiliser-discussion-sortie";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Onglet = "vote" | "discussion";
type TextesSortiePotes = Traduction<typeof TEXTES_ECRAN_SORTIE_POTES>;

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const capitaliser = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** « aujourd'hui », « demain », « hier » ou « vendredi 10 octobre » (avec l'année si ce n'est pas celle-ci). */
function decrireJour(date: Date, maintenant: Date, langue: Langue, T: TextesSortiePotes): string {
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  if (ecart === 0) return T.aujourdhui;
  if (ecart === 1) return T.demain;
  if (ecart === -1) return T.hier;
  const jour = ecrireJourLongLangue(date, langue, maintenant);
  return langue === "en" ? jour : jour.charAt(0).toLowerCase() + jour.slice(1);
}
// Une sortie reste « à venir » quelques heures après son début (le temps du repas), comme dans l'onglet Sorties
const DUREE_SORTIE = 4 * 3_600_000;
const decrireHeure = (date: Date, langue: Langue) => formaterHeureLangue(date.getHours(), date.getMinutes(), langue);

/** Demande une confirmation (Alert n'existe pas sur le web : on passe par la boîte du navigateur). */
function confirmer(titre: string, message: string, action: string, annuler: string, destructive: boolean, faire: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${titre}\n\n${message}`)) faire();
    return;
  }
  Alert.alert(titre, message, [
    { text: annuler, style: "cancel" },
    { text: action, style: destructive ? "destructive" : "default", onPress: faire },
  ]);
}

/**
 * Une sortie entre potes : en-tête, puis « Le vote » (lieux proposés, votes, lieu retenu, qui vient) et « La discussion »
 * (messages). L'organisateur invite d'autres potes, retire quelqu'un ou annule la sortie. Compte connecté : la sortie est relue
 * à l'ouverture, et sa discussion passe par la messagerie.
 */
export default function EcranSortie() {
  const T = utiliserTextes(TEXTES_ECRAN_SORTIE_POTES_PAR_LANGUE);
  const MESSAGES_SERVICE = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id, onglet: ongletDemande } = useLocalSearchParams<{ id: string; onglet?: string }>();
  const { pret, trouverSortie, trouverPote, bloques, terminerVote, quitterSortie, lireSortie, annulerSortie } = utiliserCommunaute();
  const monId = utiliserMonId();
  const [onglet, setOnglet] = useState<Onglet>(ongletDemande === "discussion" ? "discussion" : "vote");
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [quittee, setQuittee] = useState(false);
  const [annulation, setAnnulation] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  // L'heure tourne : la fin du vote, « aujourd'hui » et « demain » restent justes sans quitter l'écran
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 30_000);
    return () => clearInterval(minuterie);
  }, []);

  // Compte connecté : on relit la sortie à l'ouverture (propositions, votes, invités)
  useEffect(() => {
    if (id) lireSortie(id);
    // lireSortie change à chaque relecture de la communauté : seulement à l'ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes"));
  const sortie = id ? trouverSortie(id) : null;
  const discussion = utiliserDiscussionSortie(sortie);

  // Le temps de lire la communauté sur le téléphone, ou juste après avoir quitté la sortie : rien à montrer
  if (!pret || quittee) return <View className="flex-1 bg-creme" />;

  if (!sortie) {
    return (
      <View style={{ flex: 1, paddingTop: marges.top + 48 }} className="items-center gap-4 bg-creme px-8">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
          🫥
        </Text>
        <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
          {T.introuvableTitre}
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation(T.introuvableTexte)}
        </Text>
        <Bouton libelle={T.retour} variante="blanc" onPress={retour} />
      </View>
    );
  }

  const quand = new Date(sortie.quand);
  const fin = new Date(sortie.finVote);
  const voteFini = sortie.lieuChoisi !== null || sortie.voteTermine === true || fin <= maintenant;
  // Avec un compte, nombreVotes compte aussi les votes qu'on ne te nomme pas : c'est lui qui décide
  const lieuChoisi =
    sortie.lieuChoisi ?? (voteFini ? choisirLieuGagnant(sortie.propositions.map((p) => ({ lieuId: p.lieuId, votes: p.nombreVotes ?? p.votes.length }))) : null);
  const minutesRestantes = Math.ceil((fin.getTime() - maintenant.getTime()) / 60_000);
  const finVote = minutesRestantes < 60 ? T.dansMinutes(Math.max(1, minutesRestantes)) : T.jourHeure(decrireJour(fin, maintenant, langue, T), decrireHeure(fin, langue));

  // Les personnes bloquées ne sont plus montrées (ni dans la liste, ni en « organisée par ») ; l'organisateur en premier
  const bloquesIds = new Set(bloques.map((b) => b.id));
  const participants = [sortie.organisateur, ...sortie.participants.filter((p) => p !== sortie.organisateur)]
    .filter((p) => sortie.participants.includes(p) && !bloquesIds.has(p))
    .map(trouverPote)
    .filter((p): p is Pote => p !== null);

  const enAttente = (sortie.invites ?? []).filter((p) => !bloquesIds.has(p) && !sortie.participants.includes(p)).length;
  const organisateur = sortie.organisateur === monId;
  const passee = quand.getTime() + DUREE_SORTIE < maintenant.getTime();

  const messages = discussion.messages;
  const lignes: LigneDiscussion[] = messages.map((m, i) => {
    const date = new Date(m.date);
    const precedente = messages[i - 1];
    const nouveauJour = !precedente || debutDuJour(new Date(precedente.date)) !== debutDuJour(date);
    return { message: m, auteur: trouverPote(m.auteur), deMoi: m.auteur === monId, heure: decrireHeure(date, langue), jour: nouveauJour ? capitaliser(decrireJour(date, maintenant, langue, T)) : null };
  });

  const onglets = [
    { cle: "vote" as const, emoji: "🗳️", nom: T.ongletVote },
    // Des messages plus anciens restent à lire : le nombre serait faux
    { cle: "discussion" as const, emoji: "💬", nom: T.ongletDiscussion, nombre: discussion.plusAnciens ? undefined : messages.length },
  ];

  const demanderFinDuVote = () =>
    confirmer(T.terminerTitre, T.terminerDetail, T.terminer, T.annuler, false, () => {
      terminerVote(sortie.id);
      annoncer(T.voteTermine);
    });

  const demanderDepart = () =>
    confirmer(
      T.quitterTitre,
      organisateur ? T.quitterDetailOrganisateur : T.quitterDetail,
      T.quitter,
      T.annuler,
      true,
      () => {
        setQuittee(true);
        quitterSortie(sortie.id);
        retour();
      },
    );

  async function annuler() {
    if (!sortie) return;
    const erreur = await annulerSortie(sortie.id);
    if (erreur) return annoncer(MESSAGES_SERVICE[erreur].texte);
    setQuittee(true);
    retour();
  }

  return (
    <View className="flex-1 bg-creme">
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: marges.top }}>
          <EnTeteSortie
            sortie={sortie}
            quand={T.jourHeure(capitaliser(decrireJour(quand, maintenant, langue, T)), decrireHeure(quand, langue))}
            participants={participants}
            enAttente={enAttente}
            organisateur={bloquesIds.has(sortie.organisateur) ? null : trouverPote(sortie.organisateur)}
            onRetour={retour}
          />

          <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne px-5">
            {onglets.map((o, i) => {
              const actif = o.cle === onglet;
              const nom = o.nombre !== undefined ? T.ongletMessages(o.nom, o.nombre) : o.nom;
              // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
              return (
                <Pressable
                  key={o.cle}
                  accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
                  accessibilityLabel={Platform.OS === "ios" ? T.ongletPosition(nom, i + 1, onglets.length) : nom}
                  accessibilityState={{ selected: actif }}
                  onPress={() => {
                    vibrerLegerement();
                    setOnglet(o.cle);
                  }}
                  className={`-mb-0.5 min-h-12 flex-1 items-center justify-center border-b-2 py-2 active:opacity-70 ${actif ? "border-encre" : "border-transparent"}`}
                >
                  <Text className={`font-texte-gras text-base ${actif ? "text-encre" : "text-gris"}`}>
                    {o.emoji} {o.nom}
                    {o.nombre ? ` (${o.nombre})` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {onglet === "vote" ? (
            <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pt-4" contentContainerStyle={{ paddingBottom: marges.bottom + 24 }}>
              <VoteSortie
                sortie={sortie}
                voteFini={voteFini}
                lieuChoisi={lieuChoisi}
                finVote={finVote}
                onAnnoncer={annoncer}
                onTerminer={demanderFinDuVote}
              />
              <MembresSortie sortie={sortie} passee={passee} onAnnoncer={annoncer} />
              <View className="mt-2 items-center">
                <Pressable accessibilityRole="button" onPress={demanderDepart} hitSlop={4} className="min-h-11 items-center justify-center px-4 active:opacity-70">
                  <Text className="font-texte-semi text-base text-rouge-texte underline">{T.quitterSortie}</Text>
                </Pressable>
                {organisateur ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint={T.annulerIndice}
                    onPress={() => setAnnulation(true)}
                    hitSlop={4}
                    className="min-h-11 items-center justify-center px-4 active:opacity-70"
                  >
                    <Text className="font-texte-semi text-base text-rouge-texte underline">{T.annulerSortie}</Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>
          ) : (
            <DiscussionSortie
              lignes={lignes}
              envoyer={discussion.envoyer}
              renvoyer={discussion.renvoyer}
              plusAnciens={discussion.plusAnciens}
              onChargerPlusAnciens={discussion.chargerPlusAnciens}
              margeBas={marges.bottom}
              onAnnoncer={annoncer}
              participants={participants}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <FeuilleConfirmation
        visible={annulation}
        emoji="🗑️"
        titre={T.annulerTitre(sortie.titre)}
        detail={T.annulerDetail}
        libelleConfirmer={T.annulerSortie}
        libelleRester={T.garder}
        indiceRester={T.garderIndice}
        onConfirmer={() => void annuler()}
        onFermer={() => setAnnulation(false)}
      />

      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </View>
  );
}
