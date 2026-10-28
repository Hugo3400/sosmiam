import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { BoutonConnexion, type Fournisseur } from "~/composants/inscription/BoutonConnexion";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { TEXTES_INSCRIPTION_ACCUEIL_PAR_LANGUE } from "~/contenus/textes-inscription-accueil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserEntreeCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { effacerSessionPerdue, lireSessionPerdue } from "~/stockage/session-perdue";

const fournisseurs: Fournisseur[] = ["apple", "google", "email"];

/**
 * Étape 1 sur 4 : créer son compte avec Apple, Google ou son e-mail (le compte unique de SOS Miam, gardé sur le serveur).
 * Apple et Google : un compte existant entre tout de suite, un nouveau passe par « Fais connaissance ». E-mail : l'adresse
 * et le mot de passe d'abord, le compte est créé à « C'est prêt ». « Me connecter » pour un compte qui existe déjà.
 * « Juste jeter un œil » ouvre la visite sans compte (pas proposée si un verrou d'âge est posé sur ce
 * téléphone). Ouvert depuis la visite (« Je m'inscris »), « Retour » y ramène.
 */
export default function Compte() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_INSCRIPTION_ACCUEIL_PAR_LANGUE);
  const { invite, entrerEnInvite } = utiliserProfil();
  const { verrouAge, verrouEnLecture } = utiliserBrouillonInscription();
  const { connecterAvec, enCours } = utiliserEntreeCompte();
  const [entreeEnCours, setEntreeEnCours] = useState(false);
  // Ta session a pris fin sans que tu le demandes : on le dit, une fois, au-dessus des boutons
  const [sessionPerdue, setSessionPerdue] = useState(false);
  useEffect(() => {
    lireSessionPerdue().then((perdue) => {
      if (!perdue) return;
      setSessionPerdue(true);
      void effacerSessionPerdue();
    });
  }, []);
  const lienVisite = !invite && !verrouEnLecture && verrouAge === null;
  const choisir = (fournisseur: Fournisseur) => {
    if (fournisseur === "email") return router.push("/inscription-email");
    void connecterAvec(fournisseur);
  };
  // Arrivé directement ici (depuis la visite, qui s'est arrêtée depuis) : le retour mène à la bienvenue
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/bienvenue"));

  async function jeterUnOeil() {
    if (entreeEnCours) return;
    setEntreeEnCours(true);
    vibrerLegerement();
    // Le fil s'ouvre à la place de l'inscription (pas de retour vers elle)
    if (await entrerEnInvite().catch(() => false)) router.replace("/");
    else setEntreeEnCours(false);
  }

  return (
    <EcranEtape
      titre={T.compteTitre}
      sousTitre={T.compteSousTitre}
      etape={{ numero: 1, total: 4 }}
      onRetour={revenir}
    >
      {sessionPerdue ? (
        <View accessible accessibilityLiveRegion="polite" className="mb-4 flex-row gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
          <Text className="text-xl">🔑</Text>
          <Text className="flex-1 font-texte text-[15px] leading-[21px] text-encre">
            {lierPonctuation(T.sessionPerdue)}
          </Text>
        </View>
      ) : null}
      <View className="gap-4">
        {fournisseurs.map((fournisseur) => (
          <BoutonConnexion
            key={fournisseur}
            fournisseur={fournisseur}
            onPress={() => choisir(fournisseur)}
            enCours={enCours === fournisseur}
            desactive={enCours !== null && enCours !== fournisseur}
          />
        ))}
      </View>

      <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-1">
        <Text className="font-texte text-base text-gris">{T.dejaUnCompte}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/connexion")} hitSlop={6} className="min-h-11 justify-center px-1 active:opacity-70">
          <Text className="font-texte-gras text-base text-encre underline">{T.meConnecter}</Text>
        </Pressable>
      </View>

      {lienVisite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.pasToutDeSuiteLu}
          accessibilityHint={T.jeterUnOeilIndice}
          disabled={entreeEnCours}
          onPress={jeterUnOeil}
          hitSlop={4}
          className="mt-3 min-h-11 items-center justify-center self-center px-4 active:opacity-70"
        >
          <Text className="font-texte-semi text-base text-encre underline">{T.pasToutDeSuite}</Text>
        </Pressable>
      ) : null}

      <Text className="mt-6 text-center font-texte text-sm leading-5 text-gris">
        {T.accepterDebut}{" "}
        <Text accessibilityRole="link" onPress={() => Linking.openURL("https://sosmiam.fr/cgu")} className="font-texte-semi text-encre underline">
          {T.conditions}
        </Text>{" "}
        {T.accepterEt}{" "}
        <Text accessibilityRole="link" onPress={() => Linking.openURL("https://sosmiam.fr/confidentialite")} className="font-texte-semi text-encre underline">
          {T.confidentialite}
        </Text>
        .
      </Text>
    </EcranEtape>
  );
}
