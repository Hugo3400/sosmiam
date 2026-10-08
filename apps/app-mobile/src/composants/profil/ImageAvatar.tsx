import { Image } from "expo-image";
import { Text, View } from "react-native";

import type { Avatar } from "~/stockage/avatar-local";

type Props = {
  avatar: Avatar;
  /** Diamètre en points */
  taille: number;
};

/** L'avatar dans son rond : un emoji sur fond jaune clair, ou la photo choisie. Décoratif pour le lecteur d'écran (le prénom est lu à côté). */
export function ImageAvatar({ avatar, taille }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2 }}
      className="items-center justify-center overflow-hidden border-2 border-encre bg-jaune-clair"
    >
      {avatar.type === "photo" ? (
        <Image source={{ uri: avatar.uri }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ fontSize: taille * 0.52, lineHeight: taille * 0.66 }}>{avatar.emoji}</Text>
      )}
    </View>
  );
}
