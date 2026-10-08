import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { DiscussionSortie, type LigneDiscussion } from "~/composants/potes/DiscussionSortie";
import { EnTeteSortie } from "~/composants/potes/EnTeteSortie";
import { VoteSortie } from "~/composants/potes/VoteSortie";
import { choisirLieuGagnant } from "~/fonctions/communaute/choisir-lieu-gagnant";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Onglet = "vote" | "discussion";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const capitaliser = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** « aujourd'hui », « demain », « hier » ou « vendredi 10 octobre » (avec l'année si ce n'est pas celle-ci). */
function decrireJour(date: Date, maintenant: Date): string {
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  if (ecart === -1) return "hier";
  const longue = formaterDateLongue(formaterDateIso(date));
  return `${JOURS[date.getDay()]} ${date.getFullYear() === maintenant.getFullYear() ? longue.replace(/ \d+$/, "") : longue}`;
}
const decrireHeure = (date: Date) => formaterHeure(`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);

/** Demande une confirmation (Alert n'existe pas sur le web : on passe par la boîte du navigateur). */
function confirmer(titre: string, message: string, action: string, destructive: boolean, faire: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${titre}\n\n${message}`)) faire();
    return;
  }
  Alert.alert(titre, message, [
    { text: "Annuler", style: "cancel" },
    { text: action, style: destructive ? "destructive" : "default", onPress: faire },
  ]);
}

/** Une sortie entre potes : en-tête, puis « Le vote » (lieux proposés, votes, lieu retenu) et « La discussion » (messages). */
export default function EcranSortie() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id, onglet: ongletDemande } = useLocalSearchParams<{ id: string; onglet?: string }>();
  const { pret, trouverSortie, trouverPote, bloques, terminerVote, quitterSortie } = utiliserCommunaute();
  const [onglet, setOnglet] = useState<Onglet>(ongletDemande === "discussion" ? "discussion" : "vote");
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [quittee, setQuittee] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  // L'heure tourne : la fin du vote, « aujourd'hui » et « demain » restent justes sans quitter l'écran
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 30_000);
    return () => clearInterval(minuterie);
  }, []);

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes"));
  const sortie = id ? trouverSortie(id) : null;

  // Le temps de lire la communauté sur le téléphone, ou juste après avoir quitté la sortie : rien à montrer
  if (!pret || quittee) return <View className="flex-1 bg-creme" />;

  if (!sortie) {
    return (
      <View style={{ flex: 1, paddingTop: marges.top + 48 }} className="items-center gap-4 bg-creme px-8">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
          🫥
        </Text>
        <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
          Sortie introuvable
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Elle a peut-être été annulée, ou tu n'en fais plus partie. Pas grave : la prochaine, c'est toi qui l'organises ?")}
        </Text>
        <Bouton libelle="Retour" variante="blanc" onPress={retour} />
      </View>
    );
  }

  const quand = new Date(sortie.quand);
  const fin = new Date(sortie.finVote);
  const voteFini = sortie.lieuChoisi !== null || fin <= maintenant;
  const lieuChoisi = sortie.lieuChoisi ?? (voteFini ? choisirLieuGagnant(sortie.propositions) : null);
  const minutesRestantes = Math.ceil((fin.getTime() - maintenant.getTime()) / 60_000);
  const finVote = minutesRestantes < 60 ? `dans ${Math.max(1, minutesRestantes)} min` : `${decrireJour(fin, maintenant)} à ${decrireHeure(fin)}`;

  // Les personnes bloquées ne sont plus montrées ; l'organisateur en premier
  const bloquesIds = new Set(bloques.map((b) => b.id));
  const participants = [sortie.organisateur, ...sortie.participants.filter((p) => p !== sortie.organisateur)]
    .filter((p) => sortie.participants.includes(p) && !bloquesIds.has(p))
    .map(trouverPote)
    .filter((p): p is Pote => p !== null);

  const lignes: LigneDiscussion[] = sortie.messages.map((m, i) => {
    const date = new Date(m.date);
    const precedente = sortie.messages[i - 1];
    const nouveauJour = !precedente || debutDuJour(new Date(precedente.date)) !== debutDuJour(date);
    return { message: m, auteur: trouverPote(m.auteur), deMoi: m.auteur === ID_MOI, heure: decrireHeure(date), jour: nouveauJour ? capitaliser(decrireJour(date, maintenant)) : null };
  });

  const onglets = [
    { cle: "vote" as const, emoji: "🗳️", nom: "Le vote" },
    { cle: "discussion" as const, emoji: "💬", nom: "La discussion", nombre: sortie.messages.length },
  ];

  const demanderFinDuVote = () =>
    confirmer("Terminer le vote ?", "Le lieu qui a le plus de votes l'emporte, et plus personne ne pourra voter.", "Terminer", false, () => {
      terminerVote(sortie.id);
      annoncer("🏁 Vote terminé : on y va !");
    });

  const demanderDepart = () =>
    confirmer(
      "Quitter la sortie ?",
      sortie.organisateur === ID_MOI
        ? "Tu organises cette sortie : tes potes la garderont sans toi, et tu ne verras plus le vote ni la discussion."
        : "Tu ne verras plus le vote ni la discussion de cette sortie.",
      "Quitter",
      true,
      () => {
        setQuittee(true);
        quitterSortie(sortie.id);
        retour();
      },
    );

  return (
    <View className="flex-1 bg-creme">
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: marges.top }}>
          <EnTeteSortie
            sortie={sortie}
            quand={`${capitaliser(decrireJour(quand, maintenant))} à ${decrireHeure(quand)}`}
            participants={participants}
            organisateur={trouverPote(sortie.organisateur)}
            onRetour={retour}
          />

          <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne px-5">
            {onglets.map((o, i) => {
              const actif = o.cle === onglet;
              const nom = o.nombre !== undefined ? `${o.nom}, ${o.nombre} message${o.nombre > 1 ? "s" : ""}` : o.nom;
              // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
              return (
                <Pressable
                  key={o.cle}
                  accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
                  accessibilityLabel={Platform.OS === "ios" ? `${nom}, onglet ${i + 1} sur ${onglets.length}` : nom}
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
              <BandeauDemoPotes />
              <VoteSortie
                sortie={sortie}
                voteFini={voteFini}
                lieuChoisi={lieuChoisi}
                finVote={finVote}
                onAnnoncer={annoncer}
                onTerminer={demanderFinDuVote}
                onQuitter={demanderDepart}
              />
            </ScrollView>
          ) : (
            <DiscussionSortie sortieId={sortie.id} lignes={lignes} margeBas={marges.bottom} onAnnoncer={annoncer} />
          )}
        </View>
      </KeyboardAvoidingView>

      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </View>
  );
}
