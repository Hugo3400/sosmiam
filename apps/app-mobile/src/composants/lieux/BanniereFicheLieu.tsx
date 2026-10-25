import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { lireSourceImageLieu } from "~/fonctions/lieux/lire-source-image-lieu";

const DEBUT_DEGRADE = { x: 0.1, y: 0 };
const FIN_DEGRADE = { x: 0.9, y: 1 };
const OMBRE_HAUT = ["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"] as const;

export const BanniereFicheLieu = memo(function BanniereFicheLieu({ lieu, margeHaut }: { lieu: Lieu; margeHaut: number }) {
  const { width } = useWindowDimensions();
  const banniere = lireSourceImageLieu(lieu, "banniere");
  if (!banniere) {
    return (
      <LinearGradient colors={lieu.couleurs} start={DEBUT_DEGRADE} end={FIN_DEGRADE} style={{ height: 260 + margeHaut, alignItems: "center", justifyContent: "center" }}>
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 110, marginTop: margeHaut }}>
          {lieu.emoji}
        </Text>
      </LinearGradient>
    );
  }
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: margeHaut + Math.max(170, Math.round((width * 5) / 16)) }} className="bg-nuit">
      <Image source={banniere} contentFit="cover" transition={200} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={OMBRE_HAUT} style={{ position: "absolute", top: 0, left: 0, right: 0, height: margeHaut + 36 }} />
    </View>
  );
});
