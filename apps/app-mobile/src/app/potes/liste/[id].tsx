import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { CarteInvitationListe } from "~/composants/potes/CarteInvitationListe";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { EnTeteListe } from "~/composants/potes/EnTeteListe";
import { FeuilleCoAuteursListe } from "~/composants/potes/FeuilleCoAuteursListe";
import { FeuilleNouvelleListe } from "~/composants/potes/FeuilleNouvelleListe";
import { LigneLieuListe } from "~/composants/potes/LigneLieuListe";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECRAN_LISTE_PARTAGEE_PAR_LANGUE } from "~/contenus/textes-ecran-liste-partagee";
import { compterAbonnesListe } from "~/fonctions/communaute/compter-abonnes-liste";
import { compterLieuxListe } from "~/fonctions/communaute/compter-lieux-liste";
import { estListeSuivie } from "~/fonctions/communaute/est-liste-suivie";
import { peutRemplirListe } from "~/fonctions/communaute/peut-remplir-liste";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Confirmation = "supprimer" | "quitter" | null;

/**
 * Une liste partagée : qui l'a faite (et qui la remplit avec lui), qui la suit, et ses adresses (toucher → fiche du lieu).
 * Celle d'un pote se suit ou ne se suit plus ; seuls l'auteur et ses co-auteurs y ajoutent ou en retirent des adresses.
 * L'auteur la modifie, la supprime, et invite des potes de sa bande à la remplir avec lui. Compte connecté : la liste est lue
 * en entier à l'ouverture (ses lieux arrivent juste après).
 */
export default function EcranListePartagee() {
  const T = utiliserTextes(TEXTES_ECRAN_LISTE_PARTAGEE_PAR_LANGUE);
  const REFUS_LIMITATION = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const MESSAGES_SERVICE = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const { trouverLieu } = utiliserLieux();
  // Distance depuis le centre de ta ville (partout en France)
  const depart = utiliserPointDeDepart();
  const [choixOuvert, setChoixOuvert] = useState(false);
  const [modification, setModification] = useState(false);
  const [coAuteursOuverts, setCoAuteursOuverts] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  // La dernière demande reste affichée pendant que la feuille redescend
  const [derniereConfirmation, setDerniereConfirmation] = useState<Exclude<Confirmation, null>>("supprimer");
  const [supprimee, setSupprimee] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });

  // Compte connecté : on lit la liste en entier (ses lieux, ses co-auteurs)
  useEffect(() => {
    if (id) communaute.lireListe(id);
    // lireListe change à chaque relecture de la communauté : seulement à l'ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes"));
  const cadre = (contenu: ReactNode) => (
    <View style={{ flex: 1, paddingTop: marges.top }} className="bg-creme">
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retour}
          hitSlop={12}
          onPress={retour}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>
      {contenu}
    </View>
  );

  // Tant que la communauté n'est pas lue sur le téléphone, une liste créée par toi semblerait introuvable ; juste après une suppression, rien
  if (!communaute.pret || supprimee) return <View className="flex-1 bg-creme" />;

  const liste = communaute.listes.find((l) => l.id === id) ?? null;
  const idsBloques = new Set(communaute.bloques.map((p) => p.id));
  // La liste d'une personne bloquée disparaît pour toi, comme ses messages
  if (!liste || idsBloques.has(liste.auteur)) {
    return cadre(
      <View className="flex-1 items-center justify-center gap-4 px-8 pb-16">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-6xl">
          🗺️
        </Text>
        <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
          {T.introuvableTitre}
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation(T.introuvableTexte)}
        </Text>
        <Bouton libelle={T.retour} variante="blanc" onPress={retour} />
      </View>,
    );
  }

  const estAMoi = liste.serveur ? liste.serveur.moi.auteur : liste.auteur === monId;
  const suivie = estListeSuivie(liste, monId);
  const peutRemplir = peutRemplirListe(liste, monId);
  const statutCoAuteur = liste.serveur ? liste.serveur.moi.coAuteur : ((liste.coAuteurs ?? []).find((c) => c.id === monId)?.statut ?? null);
  // Compte connecté : seulement le résumé pour l'instant, les lieux arrivent
  const chargement = !!liste.serveur && !liste.serveur.complete;
  const auteur = communaute.trouverPote(liste.auteur);
  const connus = (ids: string[]) => ids.filter((a) => !idsBloques.has(a)).map((a) => communaute.trouverPote(a)).filter((p): p is Pote => p !== null);
  // Avec un compte, le serveur ne nomme pas les abonnés : seulement leur nombre
  const abonnes = liste.serveur ? null : connus(liste.abonnes);
  const coAuteurs = connus((liste.coAuteurs ?? []).filter((c) => c.statut === "accepte").map((c) => c.id));

  const lieux = liste.lieux.map(trouverLieu).filter((l): l is Lieu => l !== undefined);
  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette
  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));

  const basculerSuivi = () => {
    communaute.basculerSuiviListe(liste.id);
    annoncer(suivie ? T.plusSuivie : T.suivie);
  };

  const retirer = (lieu: Lieu) => {
    const confirmer = () => {
      communaute.retirerLieuListe(liste.id, lieu.id);
      annoncer(T.lieuRetire(lieu.nom));
    };
    // Sur le web (aperçu de développement), Alert n'existe pas : on retire directement
    if (Platform.OS === "web") return confirmer();
    Alert.alert(T.retirerTitre(lieu.nom), lierPonctuation(T.retirerDetail), [
      { text: T.annuler, style: "cancel" },
      { text: T.retirer, style: "destructive", onPress: confirmer },
    ]);
  };

  const ajouter = (lieuId: number) => {
    const lieu = trouverLieu(lieuId);
    // Affichée tout de suite ; si le serveur refuse, l'adresse repart de la liste et on dit pourquoi
    communaute.ajouterLieuListe(liste.id, lieuId, (erreur) =>
      annoncer(erreur === "compte-limite" ? REFUS_LIMITATION.lieuListe : T.ajoutRate(lieu?.nom ?? T.cetteAdresse)),
    );
    setChoixOuvert(false);
    annoncer(lieu ? T.lieuAjoute(lieu.nom) : T.adresseAjoutee);
  };

  const demander = (quoi: Exclude<Confirmation, null>) => {
    setDerniereConfirmation(quoi);
    setConfirmation(quoi);
  };

  async function confirmer(quoi: Exclude<Confirmation, null>) {
    if (!liste) return;
    if (quoi === "supprimer") {
      const erreur = await communaute.supprimerListe(liste.id);
      if (erreur) return annoncer(MESSAGES_SERVICE[erreur].texte);
      setSupprimee(true);
      return retour();
    }
    const erreur = await communaute.retirerCoAuteur(liste.id, "moi");
    annoncer(erreur ? MESSAGES_SERVICE[erreur].texte : T.plusRemplie(liste.titre));
  }

  // Rien à montrer : une invitation qui dépend de ce que tu peux faire
  const texteVide = estAMoi ? T.videAMoi : peutRemplir ? T.videRemplir : suivie ? T.videSuivie : T.videAutre;
  const nombreLieux = chargement ? compterLieuxListe(liste) : lieux.length;
  const textesConfirmation = {
    supprimer: {
      emoji: "🗑️",
      titre: T.supprimerTitre(liste.titre),
      detail: T.supprimerDetail,
      confirmer: T.supprimerListe,
      rester: T.supprimerRester,
    },
    quitter: {
      emoji: "👋",
      titre: T.quitterTitre,
      detail: T.quitterDetail(auteur?.prenom ?? T.sonAuteur),
      confirmer: T.quitterConfirmer,
      rester: T.quitterRester,
    },
  }[derniereConfirmation];

  return (
    <>
      {cadre(
        <ScrollView contentContainerClassName="gap-6 px-5" contentContainerStyle={{ paddingBottom: marges.bottom + 32 }}>
          {estAMoi && liste.serveur?.enModeration ? (
            <View accessible className="gap-1 rounded-carte border-2 border-encre bg-rose-alerte px-4 py-3">
              <Text className="font-texte-gras text-base text-rouge-texte">{T.enModeration}</Text>
              <Text className="font-texte text-sm leading-5 text-encre">
                {lierPonctuation(T.enModerationTexte)}
              </Text>
            </View>
          ) : null}

          {statutCoAuteur === "invite" ? <CarteInvitationListe liste={liste} ouvrirApresOui={false} /> : null}

          <EnTeteListe
            liste={liste}
            auteur={auteur}
            estAMoi={estAMoi}
            abonnes={abonnes}
            nombreAbonnes={compterAbonnesListe(liste)}
            coAuteurs={coAuteurs}
            nombreLieux={nombreLieux}
            suivie={estAMoi ? null : suivie}
            onBasculerSuivi={basculerSuivi}
            onOuvrirAuteur={(idPote) => router.push({ pathname: "/potes/profil/[id]", params: { id: idPote } })}
          />

          {estAMoi ? (
            <View className="flex-row flex-wrap justify-center gap-3">
              <Bouton libelle={T.modifier} variante="blanc" petit indice={T.modifierIndice} onPress={() => setModification(true)} />
              <Bouton
                libelle={T.remplirAPlusieurs}
                variante="blanc"
                petit
                desactive={chargement}
                indice={T.remplirAPlusieursIndice}
                onPress={() => setCoAuteursOuverts(true)}
              />
            </View>
          ) : null}

          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              {T.auMenu}
            </Text>
            {chargement ? (
              <View accessible accessibilityLabel={T.adressesArrivent} className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
                <ActivityIndicator color={couleurs.encre} />
                <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.adressesArriventTexte)}</Text>
              </View>
            ) : lieux.length === 0 ? (
              <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
                  🍽️
                </Text>
                <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texteVide)}</Text>
              </View>
            ) : (
              <View className="overflow-hidden rounded-carte border-2 border-encre bg-carte">
                {lieux.map((lieu, i) => (
                  <LigneLieuListe
                    key={lieu.id}
                    lieu={lieu}
                    km={calculerKmLieu(lieu, depart)}
                    image={trouverVignetteLieu(lieu.id, publications)}
                    derniere={i === lieux.length - 1}
                    onOuvrir={(idLieu) => router.push({ pathname: "/lieu/[id]", params: { id: String(idLieu) } })}
                    onRetirer={peutRemplir ? retirer : undefined}
                  />
                ))}
              </View>
            )}
            {peutRemplir && !chargement ? (
              <Bouton libelle={T.ajouterLieu} variante="blanc" indice={T.ajouterLieuIndice} onPress={() => setChoixOuvert(true)} className="mt-1" />
            ) : null}
          </View>

          {estAMoi || statutCoAuteur === "accepte" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityHint={estAMoi ? T.supprimerIndice : T.apresConfirmation}
              onPress={() => demander(estAMoi ? "supprimer" : "quitter")}
              hitSlop={4}
              className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
            >
              <Text className="font-texte-semi text-base text-rouge-texte underline">{estAMoi ? T.supprimerListe : T.quitterListe}</Text>
            </Pressable>
          ) : null}
        </ScrollView>,
      )}

      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
      <ChoixLieu visible={choixOuvert} titre={T.ajouterA(liste.titre)} dejaChoisis={liste.lieux} onChoisir={ajouter} onFermer={() => setChoixOuvert(false)} />
      {estAMoi ? (
        <>
          <FeuilleNouvelleListe
            visible={modification}
            liste={liste}
            onFermer={() => setModification(false)}
            onModifiee={() => {
              setModification(false);
              annoncer(T.enregistre);
            }}
          />
          <FeuilleCoAuteursListe visible={coAuteursOuverts} liste={liste} onFermer={() => setCoAuteursOuverts(false)} />
        </>
      ) : null}
      <FeuilleConfirmation
        visible={confirmation !== null}
        emoji={textesConfirmation.emoji}
        titre={textesConfirmation.titre}
        detail={textesConfirmation.detail}
        libelleConfirmer={textesConfirmation.confirmer}
        libelleRester={textesConfirmation.rester}
        onConfirmer={() => void confirmer(derniereConfirmation)}
        onFermer={() => setConfirmation(null)}
      />
    </>
  );
}
