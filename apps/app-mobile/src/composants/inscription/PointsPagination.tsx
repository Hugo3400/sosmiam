import { View } from "react-native";

/** Points sous un carrousel : le point de la diapo affichée est allongé. Annoncé « Diapo 2 sur 5 » par VoiceOver. */
export function PointsPagination({ total, actif }: { total: number; actif: number }) {
  return (
    <View accessible accessibilityLabel={`Diapo ${actif + 1} sur ${total}`} className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <View key={i} className={`h-2.5 rounded-full border-2 border-encre ${i === actif ? "w-7 bg-encre" : "w-2.5 bg-white"}`} />
      ))}
    </View>
  );
}
