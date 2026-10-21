import { Platform, Text, type ColorValue } from "react-native";

type Props = {
  titre: string;
  color: ColorValue;
  position: "beside-icon" | "below-icon";
};

export function LibelleOnglet({ titre, color, position }: Props) {
  const aCote = position === "beside-icon";
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      allowFontScaling={Platform.OS === "ios" ? false : undefined}
      style={{ color, fontSize: aCote ? 13 : 10, fontWeight: "500", textAlign: "center", marginStart: aCote ? 5 : 0 }}
    >
      {titre}
    </Text>
  );
}
