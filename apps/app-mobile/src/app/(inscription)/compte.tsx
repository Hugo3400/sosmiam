import { useRouter } from "expo-router";
import { Linking, Text, View } from "react-native";

import { BoutonConnexion, type Fournisseur } from "~/composants/inscription/BoutonConnexion";
import { EcranEtape } from "~/composants/inscription/EcranEtape";

const fournisseurs: Fournisseur[] = ["apple", "google", "email"];

/**
 * Étape 1 sur 4 : créer son compte avec Apple, Google ou son e-mail.
 * Pas encore de serveur : chaque bouton passe simplement à l'étape suivante (voir docs/decisions.md).
 */
export default function Compte() {
  const router = useRouter();
  const continuer = () => router.push("/fais-connaissance");

  return (
    <EcranEtape
      titre="Crée ton compte"
      sousTitre="Pour garder tes rescousses, tes lieux préférés et tes badges, sur tous tes appareils."
      etape={{ numero: 1, total: 4 }}
    >
      <View className="gap-4">
        {fournisseurs.map((fournisseur) => <BoutonConnexion key={fournisseur} fournisseur={fournisseur} onPress={continuer} />)}
      </View>

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
