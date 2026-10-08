import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { EtapesCommentCaMarche } from "~/composants/scan/EtapesCommentCaMarche";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

/** L'onglet Scan pendant la visite sans compte : comment une visite compte, et l'inscription directement (comme les autres onglets d'invitation). */
export function InvitationCompteScan() {
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-titre text-4xl text-encre">
            Scan
          </Text>
          <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation("Ici, tes visites comptent pour de vrai : des points, des tampons et des avis vérifiés.")}</Text>
        </View>
        <View className="items-center gap-4 rounded-carte border-2 border-encre bg-encre px-5 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
            📷
          </Text>
          <Text className="text-center font-titre-gras text-2xl leading-8 text-white">{lierPonctuation("Crée ton compte pour que tes visites comptent")}</Text>
          <Text className="text-center font-texte text-[15px] leading-[22px] text-white/80">
            {lierPonctuation("Une minute top chrono, et tes prochains restos te rapportent des points, des tampons et le droit de donner ton avis.")}
          </Text>
          <Bouton libelle="Je crée mon compte" indice="Ouvre l'inscription : une minute" onPress={() => router.push("/compte")} className="self-stretch" />
        </View>
        <EtapesCommentCaMarche />
      </ScrollView>
    </SafeAreaView>
  );
}
