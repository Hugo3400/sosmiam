import type { ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  titre: string;
  /** Les lignes de la section (LigneReglage, petites notes…) */
  children: ReactNode;
};

/** Une section d'un écran de réglages : un petit titre, lu comme un titre par VoiceOver, puis ses lignes. */
export function SectionReglages({ titre, children }: Props) {
  return (
    <View className="mb-8">
      <Text accessibilityRole="header" className="mb-1 font-titre-gras text-xl text-encre">
        {titre}
      </Text>
      <View>{children}</View>
    </View>
  );
}
