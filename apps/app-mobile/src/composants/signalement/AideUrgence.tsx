import { Linking, Pressable, Text, View } from "react-native";

const PHAROS = "https://www.internet-signalement.gouv.fr";

/** Rappel pour les contenus graves : en cas de danger, le 17 ou le 112 ; pour les contenus illégaux les plus graves, Pharos. */
export function AideUrgence() {
  return (
    <View className="gap-2 rounded-2xl border-2 border-encre bg-white p-4">
      <Text accessibilityLabel="Quelqu'un est en danger ?" className="font-texte-gras text-base text-encre">🚨 Quelqu'un est en danger ?</Text>
      <Text className="font-texte text-sm leading-5 text-encre">
        Appelle tout de suite le 17 (police) ou le 112. Pour les contenus illégaux les plus graves, tu peux aussi alerter Pharos, la plateforme
        officielle de signalement.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Appeler le 17"
          onPress={() => Linking.openURL("tel:17").catch(() => {})}
          className="min-h-11 justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">📞 Appeler le 17</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Ouvrir Pharos, la plateforme officielle de signalement"
          onPress={() => Linking.openURL(PHAROS).catch(() => {})}
          className="min-h-11 justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">Ouvrir Pharos →</Text>
        </Pressable>
      </View>
    </View>
  );
}
