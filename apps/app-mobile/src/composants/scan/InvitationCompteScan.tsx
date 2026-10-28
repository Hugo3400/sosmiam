import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { EtapesCommentCaMarche } from "~/composants/scan/EtapesCommentCaMarche";
import { TEXTES_SCAN_PAR_LANGUE } from "~/contenus/textes-scan";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** L'onglet Scan pendant la visite sans compte : comment une visite compte, et l'inscription directement (comme les autres onglets d'invitation). */
export function InvitationCompteScan() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_SCAN_PAR_LANGUE);
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-titre text-4xl text-encre">
            {T.titre}
          </Text>
          <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(T.invitationTexte)}</Text>
        </View>
        <View className="items-center gap-4 rounded-carte border-2 border-encre bg-nuit px-5 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
            📷
          </Text>
          <Text className="text-center font-titre-gras text-2xl leading-8 text-white">{lierPonctuation(T.invitationTitre)}</Text>
          <Text className="text-center font-texte text-[15px] leading-[22px] text-white/80">
            {lierPonctuation(T.invitationDetail)}
          </Text>
          <Bouton libelle={T.invitationBouton} indice={T.invitationIndice} onPress={() => router.push("/compte")} className="self-stretch" />
        </View>
        <EtapesCommentCaMarche />
      </ScrollView>
    </SafeAreaView>
  );
}
