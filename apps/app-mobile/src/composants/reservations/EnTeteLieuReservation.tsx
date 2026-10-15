import { Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";

type Props = {
  lieu: Pick<Lieu, "nom" | "emoji" | "quartier" | "ville">;
};

export function EnTeteLieuReservation({ lieu }: Props) {
  const ou = [lieu.quartier, lieu.ville].filter(Boolean).join(" · ");
  return (
    <View accessible accessibilityLabel={`${lieu.nom}, ${ou}`} className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white px-4 py-3">
      <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-jaune-clair">
        <Text allowFontScaling={false} style={{ fontSize: 24, lineHeight: 30 }}>
          {lieu.emoji}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className="font-texte-gras text-base text-encre">
          {lieu.nom}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {ou}
        </Text>
      </View>
    </View>
  );
}
