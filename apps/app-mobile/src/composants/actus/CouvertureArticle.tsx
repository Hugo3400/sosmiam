import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Pressable, View, type ImageSourcePropType } from "react-native";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = { source: ImageSourcePropType; haut: number; retour: string; onRetour: () => void };

export function CouvertureArticle({ source, haut, retour, onRetour }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View>
      <Image source={source} accessible={false} contentFit="cover" transition={150} style={{ width: "100%", height: 260 + haut }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={retour}
        hitSlop={8}
        onPress={onRetour}
        style={{ top: haut + 8 }}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>
    </View>
  );
}
