import { Image } from "expo-image";
import { memo } from "react";
import { View, type ImageSourcePropType } from "react-native";

export const LogoLieu = memo(function LogoLieu({ source, taille }: { source: ImageSourcePropType; taille: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: Math.round(taille * 0.24), borderWidth: taille >= 48 ? 2 : 1.5 }}
      className="overflow-hidden border-encre bg-carte"
    >
      <Image source={source} contentFit="cover" transition={150} style={{ width: "100%", height: "100%" }} />
    </View>
  );
});
