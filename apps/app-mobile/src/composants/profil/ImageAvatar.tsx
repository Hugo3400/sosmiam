import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";

import { construireAdressePhotoProfil } from "@sos-miam/commun/fonctions/compte/construire-adresse-photo-profil";
import { IMAGES_MIAMIS } from "~/contenus/images-miamis";
import { ADRESSE_MEDIAS } from "~/services/adresse-api";
import { AVATAR_PAR_DEFAUT, type Avatar } from "~/stockage/avatar-local";

type Props = {
  avatar: Avatar;
  /** Diamètre en points */
  taille: number;
};

/** L'avatar dans son rond : un emoji sur fond jaune clair, un Miami, ou la photo choisie (l'emoji par défaut si elle ne se charge pas). Décoratif pour le lecteur d'écran (le prénom est lu à côté). */
export function ImageAvatar({ avatar, taille }: Props) {
  // Adresse de la photo qui n'a pas voulu se charger : on retente dès que l'avatar change
  const [photoCassee, setPhotoCassee] = useState<string | null>(null);
  const [photoAffichee, setPhotoAffichee] = useState<string | null>(null);
  const source = avatar.type === "photo" ? (avatar.uri ?? (avatar.partage ? construireAdressePhotoProfil(avatar.partage, ADRESSE_MEDIAS) : null)) : null;
  const photo = source !== photoCassee ? source : null;
  const surLeTelephone = avatar.type === "photo" && avatar.uri !== null;
  const emoji = avatar.type === "emoji" ? avatar.emoji : AVATAR_PAR_DEFAUT.emoji;
  const tailleEmoji = { fontSize: taille * 0.52, lineHeight: taille * 0.66 };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2 }}
      className="items-center justify-center overflow-hidden border-2 border-encre bg-jaune-clair"
    >
      {avatar.type === "miami" ? (
        <Image source={IMAGES_MIAMIS[avatar.id]} contentFit="cover" style={{ width: "100%", height: "100%" }} />
      ) : photo ? (
        <>
          {photoAffichee === photo ? null : (
            <Text allowFontScaling={false} style={tailleEmoji}>
              {AVATAR_PAR_DEFAUT.emoji}
            </Text>
          )}
          <Image
            source={{ uri: photo }}
            cachePolicy={surLeTelephone ? "memory" : "memory-disk"}
            placeholder={photoAffichee && photoAffichee !== photo ? { uri: photoAffichee } : undefined}
            placeholderContentFit="cover"
            contentFit="cover"
            onLoad={() => setPhotoAffichee(photo)}
            onError={() => setPhotoCassee(photo)}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          />
        </>
      ) : (
        // Taille fixe : l'emoji suit le rond, pas la taille de texte du système (sinon il déborde)
        <Text allowFontScaling={false} style={tailleEmoji}>
          {emoji}
        </Text>
      )}
    </View>
  );
}
