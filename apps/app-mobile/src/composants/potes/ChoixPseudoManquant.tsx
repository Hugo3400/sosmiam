import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Invitation à choisir un pseudo, pour les profils créés avant Potes (sans pseudo, tes potes ne peuvent pas te trouver). */
export function ChoixPseudoManquant() {
  const router = useRouter();

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View className="flex-row gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
          🏷️
        </Text>
        <View className="flex-1 gap-0.5">
          <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
            Il te manque un pseudo
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation("C'est avec lui que tes potes te trouveront. Sans pseudo, tu restes un mystère : stylé, mais pas pratique pour t'inviter.")}
          </Text>
        </View>
      </View>
      <Bouton
        libelle="Choisir mon pseudo"
        variante="encre"
        petit
        indice="Ouvre tes infos pour choisir ton pseudo"
        onPress={() => router.push("/reglages/infos")}
        className="self-start"
      />
    </View>
  );
}
