import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { BoutonConnexion, type Fournisseur } from "~/composants/inscription/BoutonConnexion";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserProfil } from "~/hooks/utiliser-profil";

const fournisseurs: Fournisseur[] = ["apple", "google", "email"];

/**
 * Étape 1 sur 4 : créer son compte avec Apple, Google ou son e-mail.
 * Pas encore de serveur : chaque bouton passe simplement à l'étape suivante (voir docs/decisions.md).
 * « Juste jeter un œil » ouvre la visite sans compte (pas proposée si un verrou d'âge est posé sur ce
 * téléphone). Ouvert depuis la visite (« Je m'inscris »), « Retour » y ramène.
 */
export default function Compte() {
  const router = useRouter();
  const { invite, entrerEnInvite } = utiliserProfil();
  const { verrouAge, verrouEnLecture } = utiliserBrouillonInscription();
  const [entreeEnCours, setEntreeEnCours] = useState(false);
  const lienVisite = !invite && !verrouEnLecture && verrouAge === null;
  const continuer = () => router.push("/fais-connaissance");
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
        {fournisseurs.map((fournisseur) => <BoutonConnexion key={fournisseur} fournisseur={fournisseur} onPress={continuer} />)}
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

      <View className="mt-6 flex-row gap-3 rounded-carte border-2 border-dashed border-encre bg-white p-4">
        <Text className="text-xl">🛟</Text>
        <Text className="flex-1 font-texte text-[15px] leading-[22px] text-gris">
          Pour l'instant, c'est une démo : la connexion arrivera avec notre serveur. D'ici là, tes infos restent sur ton téléphone, dans son coffre-fort chiffré.
        </Text>
      </View>

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
