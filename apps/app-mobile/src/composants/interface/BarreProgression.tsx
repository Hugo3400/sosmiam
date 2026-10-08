import { View } from "react-native";

/** Avancement dans un parcours (« étape 2 sur 4 »), annoncé par VoiceOver. */
export function BarreProgression({ etape, total }: { etape: number; total: number }) {
  const pourcentage = Math.min(100, Math.round((etape / total) * 100));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Étape ${etape} sur ${total}`}
      accessibilityValue={{ min: 0, max: total, now: etape }}
      className="h-3 flex-1 overflow-hidden rounded-full border-2 border-encre bg-white"
    >
      <View className="h-full rounded-full bg-tomate" style={{ width: `${pourcentage}%` }} />
    </View>
  );
}
