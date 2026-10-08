import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View, type DimensionValue, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";

type Props = {
  lieu: Lieu;
  /** Image du lieu (trouverVignetteLieu) ; sans image, le dégradé du lieu et son emoji */
  image: ImageSourcePropType | null;
  hauteur: number;
  /** Carrée par défaut ; « 100% » pour une bannière en haut d'une carte */
  largeur?: DimensionValue;
  /** Arrondi des coins, en points */
  arrondi?: number;
};

/** Petite image d'un lieu, purement décorative (le texte à côté dit déjà tout au lecteur d'écran). */
export function VignetteLieu({ lieu, image, hauteur, largeur = hauteur, arrondi = 14 }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: largeur, height: hauteur, borderRadius: arrondi }}
      className="items-center justify-center overflow-hidden bg-encre"
    >
      <LinearGradient colors={lieu.couleurs} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: "absolute", inset: 0 }} />
      {image ? (
        <Image source={image} contentFit="cover" transition={150} style={{ position: "absolute", inset: 0 }} />
      ) : (
        // Taille fixe : l'emoji reste dans sa case même avec un grand texte dans les réglages du téléphone
        <Text allowFontScaling={false} style={{ fontSize: Math.round(hauteur * 0.46), lineHeight: Math.round(hauteur * 0.6) }}>
          {lieu.emoji}
        </Text>
      )}
    </View>
  );
}
