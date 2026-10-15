import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConsigneComptoirMiamSafe } from "~/composants/miam-safe/ConsigneComptoirMiamSafe";
import { PhraseComptoirMiamSafe } from "~/composants/miam-safe/PhraseComptoirMiamSafe";
import couleurs from "~/theme/couleurs";

export default function EcranMiamSafeComptoir() {
  const router = useRouter();
  const { phrase } = useLocalSearchParams<{ phrase?: string }>();
  useKeepAwake();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.encre }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}>
        {phrase === "1" ? <PhraseComptoirMiamSafe /> : <ConsigneComptoirMiamSafe />}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer l'écran Miam Safe"
        onPress={() => router.back()}
        className="mx-8 mb-4 mt-2 min-h-12 items-center justify-center rounded-full border-2 border-trait-nuit active:opacity-80"
      >
        <Text className="font-texte-gras text-base text-gris-nuit">Fermer</Text>
      </Pressable>
    </SafeAreaView>
  );
}
