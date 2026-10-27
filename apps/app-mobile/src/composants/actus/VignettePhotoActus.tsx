import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserSourceImageActus } from "~/hooks/utiliser-source-image-actus";

type Props = { valeur: string; retirer: string; onRetirer: () => void };

export function VignettePhotoActus({ valeur, retirer, onRetirer }: Props) {
  const couleurs = utiliserCouleurs();
  const source = utiliserSourceImageActus(valeur);
  return (
    <View className="h-20 w-20 overflow-hidden rounded-xl border-2 border-encre bg-jaune-clair">
      {source ? <Image source={source} accessible={false} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={retirer}
        hitSlop={8}
        onPress={onRetirer}
        className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full border-2 border-encre bg-carte"
      >
        <Ionicons name="close" size={14} color={couleurs.encre} />
      </Pressable>
    </View>
  );
}
