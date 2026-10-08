import { useRouter } from "expo-router";
import { Text } from "react-native";

import { EcranEtape } from "~/composants/inscription/EcranEtape";

/** PROVISOIRE : étape « Tes envies » (à construire). */
export default function Envies() {
  const router = useRouter();
  return (
    <EcranEtape titre="Tes envies" etape={{ numero: 3, total: 4 }} boutonPrincipal={{ libelle: "Continuer", onPress: () => router.push("/c-est-pret") }}>
      <Text className="font-texte text-base text-gris">Écran en construction.</Text>
    </EcranEtape>
  );
}
