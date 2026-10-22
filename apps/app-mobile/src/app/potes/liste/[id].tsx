import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { CarteInvitationListe } from "~/composants/potes/CarteInvitationListe";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { EnTeteListe } from "~/composants/potes/EnTeteListe";
import { FeuilleCoAuteursListe } from "~/composants/potes/FeuilleCoAuteursListe";
import { FeuilleNouvelleListe } from "~/composants/potes/FeuilleNouvelleListe";
import { LigneLieuListe } from "~/composants/potes/LigneLieuListe";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
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

type Confirmation = "supprimer" | "quitter" | null;

/**
 * Une liste partagée : qui l'a faite (et qui la remplit avec lui), qui la suit, et ses adresses (toucher → fiche du lieu).
 * Celle d'un pote se suit ou ne se suit plus ; seuls l'auteur et ses co-auteurs y ajoutent ou en retirent des adresses.
 * L'auteur la modifie, la supprime, et invite des potes de sa bande à la remplir avec lui. Compte connecté : la liste est lue
 * en entier à l'ouverture (ses lieux arrivent juste après).
 */
export default function EcranListePartagee() {
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

  // Compte connecté : on lit la liste en entier (ses lieux, ses co-auteurs) ; démo : rien
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
          accessibilityLabel="Retour"
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
          Cette liste s'est fait la malle
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Elle a peut-être été supprimée, ou elle n'est plus partagée avec toi. Pas de panique : les bonnes adresses, ce n'est pas ce qui manque !")}
        </Text>
        <Bouton libelle="Retour" variante="blanc" onPress={retour} />
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
    annoncer(suivie ? "Tu ne suis plus cette liste" : "📌 C'est noté, tu suis la liste !");
  };

  const retirer = (lieu: Lieu) => {
    const confirmer = () => {
      communaute.retirerLieuListe(liste.id, lieu.id);
      annoncer(`${lieu.nom} quitte la liste`);
    };
    // Sur le web (aperçu de développement), Alert n'existe pas : on retire directement
    if (Platform.OS === "web") return confirmer();
    Alert.alert(`Retirer ${lieu.nom} ?`, lierPonctuation("L'adresse quitte la liste. Pas de regret : tu pourras toujours la rajouter."), [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: confirmer },
    ]);
  };

  const ajouter = (lieuId: number) => {
    const lieu = trouverLieu(lieuId);
    // Affichée tout de suite ; si le serveur refuse, l'adresse repart de la liste et on dit pourquoi
    communaute.ajouterLieuListe(liste.id, lieuId, (erreur) =>
      annoncer(erreur === "compte-limite" ? REFUS_LIMITATION.lieuListe : `${lieu?.nom ?? "Cette adresse"} n'a pas pu rejoindre la liste. Réessaie dans un instant ?`),
    );
    setChoixOuvert(false);
    annoncer(lieu ? `😋 ${lieu.nom} rejoint la liste !` : "😋 Adresse ajoutée !");
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
    annoncer(erreur ? MESSAGES_SERVICE[erreur].texte : `C'est noté : tu ne remplis plus « ${liste.titre} ».`);
  }

  // Rien à montrer : une invitation qui dépend de ce que tu peux faire
  const texteVide = estAMoi
    ? "Ta liste a encore le ventre vide. Ajoute ta première adresse !"
    : peutRemplir
      ? "Pas encore d'adresse ici. Glisses-y la première !"
      : suivie
        ? "Pas encore d'adresse ici. Patience : tu verras arriver les premières pépites."
        : "Pas encore d'adresse ici. Suis la liste pour voir arriver les premières pépites !";
  const nombreLieux = chargement ? compterLieuxListe(liste) : lieux.length;
  const textesConfirmation = {
    supprimer: {
      emoji: "🗑️",
      titre: `Supprimer « ${liste.titre} » ?`,
      detail: "La liste et ses adresses disparaissent pour tout le monde, co-auteurs et abonnés compris. Les lieux, eux, restent dans l'app.",
      confirmer: "Supprimer la liste",
      rester: "Je la garde",
    },
    quitter: {
      emoji: "👋",
      titre: "Ne plus remplir cette liste ?",
      detail: `Tu ne pourras plus y ajouter d'adresses. Celles que tu as glissées restent, et ${auteur?.prenom ?? "son auteur"} pourra toujours te réinviter.`,
      confirmer: "Ne plus la remplir",
      rester: "Je continue",
    },
  }[derniereConfirmation];

  return (
    <>
      {cadre(
        <ScrollView contentContainerClassName="gap-6 px-5" contentContainerStyle={{ paddingBottom: marges.bottom + 32 }}>
          {estAMoi && liste.serveur?.enModeration ? (
            <View accessible className="gap-1 rounded-carte border-2 border-encre bg-rose-alerte px-4 py-3">
              <Text className="font-texte-gras text-base text-rouge-texte">⏳ En attente de la modération</Text>
              <Text className="font-texte text-sm leading-5 text-encre">
                {lierPonctuation("Pour l'instant, tu es la seule personne à la voir : l'équipe de modération y jette un œil.")}
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
              <Bouton libelle="Modifier" variante="blanc" petit indice="Le nom, l'emoji, la description ou qui la voit" onPress={() => setModification(true)} />
              <Bouton
                libelle="Remplir à plusieurs"
                variante="blanc"
                petit
                desactive={chargement}
                indice="Invite des potes de ta bande à y ajouter leurs pépites"
                onPress={() => setCoAuteursOuverts(true)}
              />
            </View>
          ) : null}

          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              Au menu
            </Text>
            {chargement ? (
              <View accessible accessibilityLabel="Les adresses arrivent" className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
                <ActivityIndicator color={couleurs.encre} />
                <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation("On sort les bonnes adresses du carnet…")}</Text>
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
              <Bouton libelle="Ajouter un lieu" variante="blanc" indice="Choisis une adresse à ajouter à la liste" onPress={() => setChoixOuvert(true)} className="mt-1" />
            ) : null}
          </View>

          {estAMoi || statutCoAuteur === "accepte" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityHint={estAMoi ? "Après confirmation, elle disparaît pour tout le monde" : "Après confirmation"}
              onPress={() => demander(estAMoi ? "supprimer" : "quitter")}
              hitSlop={4}
              className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
            >
              <Text className="font-texte-semi text-base text-rouge-texte underline">{estAMoi ? "Supprimer la liste" : "Ne plus remplir cette liste"}</Text>
            </Pressable>
          ) : null}

          <BandeauDemoPotes />
        </ScrollView>,
      )}

      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
      <ChoixLieu visible={choixOuvert} titre={`Ajouter à « ${liste.titre} »`} dejaChoisis={liste.lieux} onChoisir={ajouter} onFermer={() => setChoixOuvert(false)} />
      {estAMoi ? (
        <>
          <FeuilleNouvelleListe
            visible={modification}
            liste={liste}
            onFermer={() => setModification(false)}
            onModifiee={() => {
              setModification(false);
              annoncer("✏️ C'est enregistré !");
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
