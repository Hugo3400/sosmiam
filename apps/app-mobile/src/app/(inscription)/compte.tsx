import { useRouter } from "expo-router";
import { Text } from "react-native";

import { EcranEtape } from "~/composants/inscription/EcranEtape";

/** PROVISOIRE : étape « Crée ton compte » (à construire). */
export default function Compte() {
  const router = useRouter();
  return (
    <EcranEtape titre="Crée ton compte" etape={{ numero: 1, total: 4 }} boutonPrincipal={{ libelle: "Continuer", onPress: () => router.push("/fais-connaissance") }}>
      <Text className="font-texte text-base text-gris">Écran en construction.</Text>
    </EcranEtape>
  );
}
