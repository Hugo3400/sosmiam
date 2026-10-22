import { Text, View } from "react-native";

import { TEXTES_MESSAGES } from "~/contenus/textes-messages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function AstuceDoubleToucher() {
  return (
    <View className="items-center px-4 pt-2">
      <View accessible accessibilityLabel={TEXTES_MESSAGES.astuceDoubleToucher} className="flex-row items-center gap-2 rounded-2xl border border-dashed border-gris bg-carte px-3 py-2">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" allowFontScaling={false} style={{ fontSize: 18, lineHeight: 22 }}>
          {TEXTES_MESSAGES.emojiDoubleToucher}
        </Text>
        <Text className="shrink font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(TEXTES_MESSAGES.astuceDoubleToucher)}</Text>
      </View>
    </View>
  );
}
