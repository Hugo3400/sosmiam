import { Pressable, Text, useWindowDimensions, View, type PressableProps } from "react-native";

import type { GifApi } from "@sos-miam/commun/types/messagerie";
import { ImageGifChat } from "~/composants/chat/ImageGifChat";
import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";
import { calculerTailleGif } from "~/fonctions/chat/calculer-taille-gif";

type Props = {
  gif: GifApi;
  deMoi: boolean;
  libelle: string;
  onPress: () => void;
  onAppuiLong: () => void;
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

const LARGEUR_MAX = 220;

export function GifChat({ gif, deMoi, libelle, onPress, onAppuiLong, actionsLecteur }: Props) {
  const { width } = useWindowDimensions();
  const taille = calculerTailleGif(gif, Math.min(LARGEUR_MAX, Math.round(width * 0.58)));
  const coins = deMoi ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-tl-md";
  return (
    <Pressable
      accessibilityRole="image"
      accessibilityLabel={libelle}
      onPress={onPress}
      onLongPress={onAppuiLong}
      delayLongPress={350}
      {...actionsLecteur}
      className={`overflow-hidden border-2 border-encre bg-ligne active:opacity-80 ${coins}`}
    >
      <ImageGifChat gif={gif} largeur={taille.largeur} hauteur={taille.hauteur} />
      <View pointerEvents="none" style={{ position: "absolute", left: 8, bottom: 8 }} className="rounded-md bg-nuit/70 px-1.5 py-px">
        <Text allowFontScaling={false} className="font-texte-gras text-[11px] tracking-wider text-lait">
          {T.badgeGif}
        </Text>
      </View>
    </Pressable>
  );
}
