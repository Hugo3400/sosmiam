import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = { titre: string; retour: string; detail?: string; onRetour: () => void };

export function EnTeteEcranActus({ titre, retour, detail, onRetour }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={retour}
        hitSlop={8}
        onPress={onRetour}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>
      <View className="flex-1">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {titre}
        </Text>
        {detail ? <Text className="font-texte text-xs text-gris">{detail}</Text> : null}
      </View>
    </View>
  );
}
