import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConsigneComptoirMiamSafe } from "~/composants/miam-safe/ConsigneComptoirMiamSafe";
import { PhraseComptoirMiamSafe } from "~/composants/miam-safe/PhraseComptoirMiamSafe";
import { ECRAN_COMPTOIR_MIAM_SAFE } from "~/contenus/ecran-comptoir-miam-safe";
import { TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE } from "~/contenus/textes-miam-safe-aide";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function EcranMiamSafeComptoir() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { phrase } = useLocalSearchParams<{ phrase?: string }>();
  const avecCompte = utiliserProfil().profil !== null;
  const T = utiliserTextes(TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE);
  useKeepAwake();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.nuit }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}>
        {phrase === "1" && avecCompte ? <PhraseComptoirMiamSafe /> : <ConsigneComptoirMiamSafe />}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.fermerEcranLu}
        onPress={() => router.back()}
        className="mx-8 mb-4 mt-2 min-h-12 items-center justify-center rounded-full border-2 border-trait-nuit active:opacity-80"
      >
        <Text className="font-texte-gras text-base text-gris-nuit">{ECRAN_COMPTOIR_MIAM_SAFE.fermer}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
