import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";

type Props = {
  emoji: string;
  titre: string;
  detail: string;
  indice: string;
  onPress: () => void;
};

export function TuileRaccourci({ emoji, titre, detail, indice, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titre}, ${retirerEmoji(detail)}`}
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="flex-1 gap-2 rounded-carte border-2 border-encre bg-white p-3.5 active:opacity-80"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-jaune">
        <Text className="text-lg">{emoji}</Text>
      </View>
      <Text className="font-texte-gras text-[15px] leading-5 text-encre">{titre}</Text>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85} className="min-h-9 font-texte text-[13px] leading-[18px] text-gris">
        {lierPonctuation(detail)}
      </Text>
    </Pressable>
  );
}
