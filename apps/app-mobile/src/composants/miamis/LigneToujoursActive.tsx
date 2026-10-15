import { Switch, Text, View } from "react-native";

import couleurs from "~/theme/couleurs";

type Props = {
  titre: string;
  detail: string;
};

export function LigneToujoursActive({ titre, detail }: Props) {
  return (
    <View accessible accessibilityRole="switch" accessibilityLabel={titre} accessibilityHint={detail} accessibilityState={{ checked: true, disabled: true }} className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3">
      <View className="flex-1">
        <Text className="font-texte-gras text-base text-encre">{titre}</Text>
        <Text className="font-texte text-sm text-gris">{detail}</Text>
      </View>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch value disabled trackColor={{ false: couleurs.ligne, true: couleurs.encre }} thumbColor={couleurs.jaune} />
      </View>
    </View>
  );
}
