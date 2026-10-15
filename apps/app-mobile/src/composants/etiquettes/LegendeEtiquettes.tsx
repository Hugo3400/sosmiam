import { Text, View } from "react-native";

export function LegendeEtiquettes() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row flex-wrap gap-x-4 gap-y-1">
      <View className="flex-row items-center gap-1.5">
        <View className="h-3 w-[18px] rounded-md bg-jaune-clair" />
        <Text className="font-texte text-xs text-gris">confirmée par le lieu</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="h-3 w-[18px] rounded-md border-[1.5px] border-dashed border-gris" />
        <Text className="font-texte text-xs text-gris">proposée par les Miamis</Text>
      </View>
    </View>
  );
}
