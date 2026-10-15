import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { enchainerPhrases } from "~/fonctions/texte/enchainer-phrases";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  emoji: string;
  titre: string;
  texte: string;
};

export function EncadreRefusEnvoiAvis({ emoji, titre, texte }: Props) {
  const annonce = enchainerPhrases([titre, texte]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(annonce);
  }, [annonce]);

  return (
    <View accessible accessibilityLabel={annonce} className="flex-row gap-3 rounded-2xl border-2 border-tomate bg-rose-alerte px-4 py-3">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
        {emoji}
      </Text>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(titre)}</Text>
        <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
      </View>
    </View>
  );
}
