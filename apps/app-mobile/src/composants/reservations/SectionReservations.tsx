import type { ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  titre: string;
  nombre: number;
  children: ReactNode;
};

export function SectionReservations({ titre, nombre, children }: Props) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" accessibilityLabel={`${titre}, ${nombre} réservation${nombre > 1 ? "s" : ""}`} className="font-titre-gras text-xl text-encre">
        {titre}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
