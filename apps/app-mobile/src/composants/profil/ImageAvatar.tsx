import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";

import { AVATAR_PAR_DEFAUT, type Avatar } from "~/stockage/avatar-local";

type Props = {
  avatar: Avatar;
  /** Diamètre en points */
  taille: number;
};

/** L'avatar dans son rond : un emoji sur fond jaune clair, ou la photo choisie (l'emoji par défaut si elle ne se charge pas). Décoratif pour le lecteur d'écran (le prénom est lu à côté). */
export function ImageAvatar({ avatar, taille }: Props) {
  // Adresse de la photo qui n'a pas voulu se charger : on retente dès que l'avatar change
  const [photoCassee, setPhotoCassee] = useState<string | null>(null);
  const photo = avatar.type === "photo" && avatar.uri !== photoCassee ? avatar.uri : null;
  const emoji = avatar.type === "emoji" ? avatar.emoji : AVATAR_PAR_DEFAUT.emoji;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2 }}
      className="items-center justify-center overflow-hidden border-2 border-encre bg-jaune-clair"
    >
      {photo ? (
        <Image source={{ uri: photo }} contentFit="cover" onError={() => setPhotoCassee(photo)} style={{ width: "100%", height: "100%" }} />
      ) : (
        // Taille fixe : l'emoji suit le rond, pas la taille de texte du système (sinon il déborde)
        <Text allowFontScaling={false} style={{ fontSize: taille * 0.52, lineHeight: taille * 0.66 }}>
          {emoji}
        </Text>
      )}
    </View>
  );
}
