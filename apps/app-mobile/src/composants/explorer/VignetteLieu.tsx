import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { StyleSheet, Text, View, type DimensionValue, type ImageSourcePropType } from "react-native";

import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { LogoLieu } from "~/composants/lieux/LogoLieu";
import { lireSourceImageLieu } from "~/fonctions/lieux/lire-source-image-lieu";

type Props = {
  lieu: Lieu;
  /** Image du lieu (trouverVignetteLieu) ; sans image, le dégradé du lieu et son emoji */
  image: ImageSourcePropType | null;
  hauteur: number;
  /** Carrée par défaut ; « 100% » pour une bannière en haut d'une carte */
  largeur?: DimensionValue;
  /** Arrondi des coins, en points */
  arrondi?: number;
  avecLogo?: boolean;
};

const DEBUT_DEGRADE = { x: 0.1, y: 0 };
const FIN_DEGRADE = { x: 0.9, y: 1 };

/** Petite image d'un lieu, purement décorative (le texte à côté dit déjà tout au lecteur d'écran). */
export const VignetteLieu = memo(function VignetteLieu({ lieu, image, hauteur, largeur = hauteur, arrondi = 14, avecLogo = false }: Props) {
  const logo = avecLogo && estLieuVerifie(lieu) ? lireSourceImageLieu(lieu, "logo") : null;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: largeur, height: hauteur, borderRadius: arrondi }}
      className="items-center justify-center overflow-hidden bg-nuit"
    >
      <LinearGradient colors={lieu.couleurs} start={DEBUT_DEGRADE} end={FIN_DEGRADE} style={styles.plein} />
      {image ? (
        <Image source={image} contentFit="cover" transition={150} style={styles.plein} />
      ) : (
        // Taille fixe : l'emoji reste dans sa case même avec un grand texte dans les réglages du téléphone
        <Text allowFontScaling={false} style={{ fontSize: Math.round(hauteur * 0.46), lineHeight: Math.round(hauteur * 0.6) }}>
          {lieu.emoji}
        </Text>
      )}
      {logo ? (
        <View style={{ position: "absolute", right: 3, bottom: 3 }}>
          <LogoLieu source={logo} taille={Math.max(20, Math.round(Math.min(hauteur, 84) * 0.42))} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({ plein: { position: "absolute", inset: 0 } });
