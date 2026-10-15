import type { ReactNode } from "react";
import { View } from "react-native";

import type { GlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";

type Props = {
  geste: GlisserPourFermer;
  ecart?: "petit" | "moyen" | "grand";
  className?: string;
  children?: ReactNode;
};

const ECARTS = { petit: "mb-1", moyen: "mb-3", grand: "mb-4" } as const;

export function PoigneeFeuille({ geste, ecart = "moyen", className = "", children }: Props) {
  return (
    <View {...geste.panHandlers} className={`pt-3 web:cursor-grab web:touch-none web:select-none ${className}`}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={`${ECARTS[ecart]} h-1.5 w-12 self-center rounded-full bg-ligne`} />
      {children}
    </View>
  );
}
