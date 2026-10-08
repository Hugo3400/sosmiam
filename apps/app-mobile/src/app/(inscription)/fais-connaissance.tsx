import { useRouter } from "expo-router";
import { Text } from "react-native";

import { AGE_MINIMUM_INSCRIPTION } from "@sos-miam/commun/regles/ages";
import { EcranEtape } from "~/composants/inscription/EcranEtape";

/** PROVISOIRE : étape « Fais connaissance » (à construire). */
export default function FaisConnaissance() {
  const router = useRouter();
  return (
    <EcranEtape titre="Fais connaissance" etape={{ numero: 2, total: 4 }} boutonPrincipal={{ libelle: "Continuer", onPress: () => router.push("/envies") }}>
      <Text className="font-texte text-base text-gris">Écran en construction (inscription dès {AGE_MINIMUM_INSCRIPTION} ans).</Text>
    </EcranEtape>
  );
}
