import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  emoji: string;
  texte: string;
};

export function EncadreAvis({ emoji, texte }: Props) {
  return (
    <View accessible accessibilityLabel={texte} className="flex-row items-start gap-3 self-stretch rounded-carte border-2 border-ligne bg-jaune-clair p-4">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
        {emoji}
      </Text>
      <Text className="flex-1 font-texte text-[15px] leading-6 text-encre">{lierPonctuation(texte)}</Text>
    </View>
  );
}
