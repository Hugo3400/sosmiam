import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { BoutonConnexion, type Fournisseur } from "~/composants/inscription/BoutonConnexion";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserEntreeCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

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
  const { invite, entrerEnInvite } = utiliserProfil();
  const { verrouAge, verrouEnLecture, modifier } = utiliserBrouillonInscription();
  const { connecterAvec, enCours } = utiliserEntreeCompte();
  const [entreeEnCours, setEntreeEnCours] = useState(false);
  const lienVisite = !invite && !verrouEnLecture && verrouAge === null;
  const choisir = (fournisseur: Fournisseur) => {
    if (fournisseur === "email") return router.push("/inscription-email");
    void connecterAvec(fournisseur);
  };
  // Démo (développement) : un profil gardé sur le téléphone seulement, sans compte sur le serveur
  const continuerEnDemo = () => {
    modifier({ connexion: null });
    router.push("/fais-connaissance");
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
      titre="Crée ton compte"
      sousTitre="Pour garder tes rescousses, tes lieux préférés et tes badges, sur tous tes appareils."
      etape={{ numero: 1, total: 4 }}
      onRetour={revenir}
    >
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
        <Text className="font-texte text-base text-gris">Déjà un compte ?</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/connexion")} hitSlop={6} className="min-h-11 justify-center px-1 active:opacity-70">
          <Text className="font-texte-gras text-base text-encre underline">Me connecter</Text>
        </Pressable>
      </View>

      {lienVisite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pas tout de suite : juste jeter un œil, sans compte"
          accessibilityHint="Regarde le fil, la carte et les lieux sans t'inscrire. Tu créeras ton compte quand tu voudras."
          disabled={entreeEnCours}
          onPress={jeterUnOeil}
          hitSlop={4}
          className="mt-3 min-h-11 items-center justify-center self-center px-4 active:opacity-70"
        >
          <Text className="font-texte-semi text-base text-encre underline">Pas tout de suite, juste jeter un œil 👀</Text>
        </Pressable>
      ) : null}

      {DEMO_VISITES_ACTIVE ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Seulement en développement : un profil gardé sur ce téléphone, sans compte sur le serveur"
          onPress={continuerEnDemo}
          className="mt-6 flex-row gap-3 rounded-carte border-2 border-dashed border-encre bg-white p-4 active:opacity-70"
        >
          <Text className="text-xl">🧪</Text>
          <Text className="flex-1 font-texte text-[15px] leading-[22px] text-gris">
            <Text className="font-texte-gras text-encre underline">Démo : continuer sans compte</Text> (développement seulement). Ton profil reste sur ce téléphone.
          </Text>
        </Pressable>
      ) : null}

      <Text className="mt-6 text-center font-texte text-sm leading-5 text-gris">
        En continuant, tu acceptes les{" "}
        <Text accessibilityRole="link" onPress={() => Linking.openURL("https://sosmiam.fr/cgu")} className="font-texte-semi text-encre underline">
          conditions d'utilisation
        </Text>{" "}
        et la{" "}
        <Text accessibilityRole="link" onPress={() => Linking.openURL("https://sosmiam.fr/confidentialite")} className="font-texte-semi text-encre underline">
          politique de confidentialité
        </Text>
        .
      </Text>
    </EcranEtape>
  );
}
