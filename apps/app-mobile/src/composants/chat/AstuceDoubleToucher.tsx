import { Text, View } from "react-native";

import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function AstuceDoubleToucher() {
  const T = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  return (
    <View className="items-center border-b border-ligne px-4 pb-2 pt-2">
      <View accessible accessibilityLabel={T.astuceDoubleToucher} className="flex-row items-center gap-2 rounded-2xl border border-dashed border-gris bg-carte px-3 py-2">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" allowFontScaling={false} style={{ fontSize: 18, lineHeight: 22 }}>
          {T.emojiDoubleToucher}
        </Text>
        <Text className="shrink font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.astuceDoubleToucher)}</Text>
      </View>
    </View>
  );
}
