import { Linking, Pressable, Text, View } from "react-native";

import { NUMEROS_URGENCE } from "~/contenus/miam-safe";

/**
 * Les secours en un appui, toujours en premier dans Miam Safe : 17, 18, 15, 112, et le 114 par SMS.
 * Accessibles même sans compte.
 */
export function NumerosUrgence() {
  return (
    <View className="gap-3 rounded-2xl bg-encre p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-base text-creme">
        Danger réel ? Appelle tout de suite.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {NUMEROS_URGENCE.map((n) => (
          <Pressable
            key={n.numero}
            accessibilityRole="button"
            accessibilityLabel={n.lu}
            onPress={() => Linking.openURL(n.lien).catch(() => {})}
            className="min-h-14 min-w-[30%] grow items-center justify-center rounded-2xl bg-tomate px-3 py-2 active:opacity-80"
          >
            <Text className="font-titre-gras text-2xl text-encre">{n.numero}</Text>
            <Text className="font-texte-semi text-xs text-encre">{n.libelle}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
