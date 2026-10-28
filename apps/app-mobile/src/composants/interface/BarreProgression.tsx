import { View } from "react-native";

import { TEXTES_INTERFACE_PAR_LANGUE } from "~/contenus/textes-interface";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Avancement dans un parcours (« étape 2 sur 4 »), annoncé par VoiceOver. */
export function BarreProgression({ etape, total }: { etape: number; total: number }) {
  const T = utiliserTextes(TEXTES_INTERFACE_PAR_LANGUE);
  const pourcentage = Math.min(100, Math.round((etape / total) * 100));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={T.etape(etape, total)}
      accessibilityValue={{ min: 0, max: total, now: etape }}
      className="h-3 flex-1 overflow-hidden rounded-full border-2 border-encre bg-carte"
    >
      <View className="h-full rounded-full bg-tomate" style={{ width: `${pourcentage}%` }} />
    </View>
  );
}
