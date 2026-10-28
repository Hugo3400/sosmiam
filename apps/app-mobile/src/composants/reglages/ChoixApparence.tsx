import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { TEXTES_PARAMETRES_PAR_LANGUE } from "~/contenus/textes-parametres";
import { REGLAGES_APPARENCE } from "~/contenus/type-apparence";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserTheme } from "~/hooks/utiliser-theme";

export function ChoixApparence() {
  const T = utiliserTextes(TEXTES_PARAMETRES_PAR_LANGUE).apparence;
  const { reglage, changerReglage, couleurs } = utiliserTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={T.titre}>
      {REGLAGES_APPARENCE.map((choix) => {
        const texte = T.choix[choix];
        const choisi = reglage === choix;
        return (
          <Pressable
            key={choix}
            accessibilityRole="radio"
            accessibilityState={{ checked: choisi }}
            accessibilityLabel={`${texte.titre}, ${texte.detail}`}
            onPress={() => {
              if (choisi) return;
              vibrerLegerement();
              changerReglage(choix);
            }}
            className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
          >
            <Text className="text-2xl">{texte.emoji}</Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-base text-encre">{texte.titre}</Text>
              <Text className="font-texte text-sm text-gris">{texte.detail}</Text>
            </View>
            {choisi ? (
              <View className="h-7 w-7 items-center justify-center rounded-full border-2 border-encre bg-jaune">
                <Ionicons name="checkmark" size={16} color={couleurs.nuit} />
              </View>
            ) : (
              <View className="h-7 w-7 rounded-full border-2 border-encre" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
