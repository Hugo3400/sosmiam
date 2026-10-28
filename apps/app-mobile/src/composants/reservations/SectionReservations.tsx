import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  titre: string;
  nombre: number;
  children: ReactNode;
};

export function SectionReservations({ titre, nombre, children }: Props) {
  const T = utiliserTextes(CARTE_RESERVATION_PAR_LANGUE);
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" accessibilityLabel={T.sectionLu(titre, nombre)} className="font-titre-gras text-xl text-encre">
        {titre}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
