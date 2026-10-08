import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  lieu: Lieu;
  /** Image du lieu ou de la publication ; sans image, le dégradé du lieu et son emoji */
  image: ImageSourcePropType | null;
  /** Ce que le lecteur d'écran annonce (le nom du lieu y est déjà) */
  libelle: string;
  onPress: () => void;
};

/** Une case carrée de la grille Gardés / J'aime : l'image (ou le dégradé du lieu), avec le nom du lieu lisible dessus. */
export function VignetteCollection({ lieu, image, libelle, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint="Ouvre la fiche du lieu"
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      style={{ width: "33.333%", aspectRatio: 1 }}
      className="p-0.5 active:opacity-80"
    >
      <View className="flex-1 overflow-hidden rounded-xl bg-encre">
        <LinearGradient colors={lieu.couleurs} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: "absolute", inset: 0 }} />
        {image ? (
          <Image source={image} contentFit="cover" style={{ position: "absolute", inset: 0 }} />
        ) : (
          <View className="flex-1 items-center justify-center pb-4">
            <Text className="text-4xl">{lieu.emoji}</Text>
          </View>
        )}
        {/* Voile sombre en bas : le nom reste lisible sur n'importe quelle image */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" }} />
        <Text numberOfLines={2} className="absolute bottom-1.5 left-2 right-2 font-texte-gras text-xs leading-4 text-white">
          {lieu.nom}
        </Text>
      </View>
    </Pressable>
  );
}
