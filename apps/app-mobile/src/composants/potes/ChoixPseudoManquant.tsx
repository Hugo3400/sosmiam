import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_BANDE_ACTIVITE_PAR_LANGUE } from "~/contenus/textes-bande-activite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Invitation à choisir un pseudo, pour les profils créés avant Potes (sans pseudo, tes potes ne peuvent pas te trouver). */
export function ChoixPseudoManquant() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_BANDE_ACTIVITE_PAR_LANGUE).pseudo;

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View className="flex-row gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
          🏷️
        </Text>
        <View className="flex-1 gap-0.5">
          <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
            {T.titre}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(T.texte)}
          </Text>
        </View>
      </View>
      <Bouton
        libelle={T.choisir}
        variante="encre"
        petit
        indice={T.indiceChoisir}
        onPress={() => router.push("/reglages/infos")}
        className="self-start"
      />
    </View>
  );
}
