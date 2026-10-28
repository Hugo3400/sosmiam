import { Linking, Pressable, Text, View } from "react-native";

import { TEXTES_SIGNALEMENT_PAR_LANGUE } from "~/contenus/textes-signalement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const PHAROS = "https://www.internet-signalement.gouv.fr";

/** Rappel pour les contenus graves : en cas de danger, le 17 ou le 112 ; pour les contenus illégaux les plus graves, Pharos. */
export function AideUrgence() {
  const T = utiliserTextes(TEXTES_SIGNALEMENT_PAR_LANGUE);
  return (
    <View className="gap-2 rounded-2xl border-2 border-encre bg-carte p-4">
      <Text accessibilityLabel={T.dangerLu} className="font-texte-gras text-base text-encre">{T.danger}</Text>
      <Text className="font-texte text-sm leading-5 text-encre">{T.dangerTexte}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.appeler17Lu}
          onPress={() => Linking.openURL("tel:17").catch(() => {})}
          className="min-h-11 justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-nuit">{T.appeler17}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={T.pharosLu}
          onPress={() => Linking.openURL(PHAROS).catch(() => {})}
          className="min-h-11 justify-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">{T.pharos}</Text>
        </Pressable>
      </View>
    </View>
  );
}
