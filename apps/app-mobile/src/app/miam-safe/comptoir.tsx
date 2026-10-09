import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PHRASE_MIAM_SAFE } from "@sos-miam/commun/regles/miam-safe";
import { Mascotte } from "~/composants/marque/Mascotte";
import couleurs from "~/theme/couleurs";

/**
 * L'écran à montrer au personnel d'un lieu Miam Safe : sombre et peu lumineux pour ne pas attirer l'œil, le Capitaine qui
 * fait un clin d'œil et la phrase en gros (anodine pour qui la voit de loin), la vraie consigne en petit, pour l'équipe.
 * L'écran reste allumé tant qu'il est ouvert.
 */
export default function EcranMiamSafeComptoir() {
  const router = useRouter();
  useKeepAwake();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.encre }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center gap-5 px-8">
        <Mascotte expression="clin" taille={150} />
        <View className="rounded-full border-2 border-jaune px-3 py-1">
          <Text className="font-texte-gras text-sm text-jaune">🛡 Miam Safe</Text>
        </View>
        <Text accessibilityRole="header" className="text-center font-titre-gras text-4xl text-creme">
          {PHRASE_MIAM_SAFE}
        </Text>
        <Text className="max-w-[280px] text-center font-texte-semi text-sm leading-5 text-gris-nuit">
          Pour l'équipe : cette personne a besoin d'aide. Accompagne-la à l'écart, sans bruit, et demande-lui ce qu'il lui faut.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer l'écran Miam Safe"
        onPress={() => router.back()}
        className="mx-8 mb-4 min-h-12 items-center justify-center rounded-full border-2 border-trait-nuit active:opacity-80"
      >
        <Text className="font-texte-gras text-base text-gris-nuit">Fermer</Text>
      </Pressable>
    </SafeAreaView>
  );
}
