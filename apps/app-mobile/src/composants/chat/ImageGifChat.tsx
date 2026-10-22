import { Image } from "expo-image";
import { Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import type { GifApi } from "@sos-miam/commun/types/messagerie";
import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";

type Props = {
  gif: GifApi;
  largeur: number;
  hauteur: number;
};

const FONDS_EXEMPLE = ["bg-jaune-clair", "bg-rose-alerte", "bg-ligne", "bg-jaune"] as const;

export function ImageGifChat({ gif, largeur, hauteur }: Props) {
  const animationsReduites = useReducedMotion();
  if (gif.url.startsWith("exemple:")) {
    const fond = FONDS_EXEMPLE[Array.from(gif.id).reduce((n, c) => n + c.charCodeAt(0), 0) % FONDS_EXEMPLE.length];
    return (
      <View style={{ width: largeur, height: hauteur }} className={`items-center justify-center gap-1 ${fond}`}>
        <Text allowFontScaling={false} style={{ fontSize: Math.min(56, hauteur * 0.4), lineHeight: Math.min(68, hauteur * 0.5) }}>
          {gif.url.slice("exemple:".length)}
        </Text>
        <Text className={`font-texte-gras text-xs ${fond === "bg-jaune" ? "text-nuit" : "text-gris"}`}>{T.badgeGif}</Text>
      </View>
    );
  }
  return (
    <View style={{ width: largeur, height: hauteur }} className="bg-ligne">
      <Image source={{ uri: gif.url }} autoplay={!animationsReduites} contentFit="cover" transition={animationsReduites ? 0 : 120} cachePolicy="memory-disk" style={{ flex: 1 }} />
    </View>
  );
}
