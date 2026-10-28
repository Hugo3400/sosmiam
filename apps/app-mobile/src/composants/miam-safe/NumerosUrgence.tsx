import { Linking, Pressable, Text, View } from "react-native";

import { NUMEROS_URGENCE_PAR_LANGUE } from "~/contenus/miam-safe";
import { TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE } from "~/contenus/textes-miam-safe-aide";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Les secours en un appui, toujours en premier dans Miam Safe : 17, 18, 15, 112, et le 114 par SMS (en anglais, le 112
 * passe devant). Accessibles même sans compte.
 */
export function NumerosUrgence() {
  const T = utiliserTextes(TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE);
  const numeros = utiliserTextes(NUMEROS_URGENCE_PAR_LANGUE);
  return (
    <View className="gap-3 rounded-2xl bg-nuit p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-base text-lait">
        {lierPonctuation(T.dangerReel)}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {numeros.map((n) => (
          <Pressable
            key={n.numero}
            accessibilityRole="button"
            accessibilityLabel={n.lu}
            onPress={() => Linking.openURL(n.lien).catch(() => {})}
            className="min-h-14 min-w-[30%] grow items-center justify-center rounded-2xl bg-tomate px-3 py-2 active:opacity-80"
          >
            <Text className="font-titre-gras text-2xl text-nuit">{n.numero}</Text>
            <Text className="font-texte-semi text-xs text-nuit">{n.libelle}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
