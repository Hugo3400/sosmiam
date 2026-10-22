import { Image } from "expo-image";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { Platform, Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated from "react-native-reanimated";

import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { ZOOM_MAX } from "~/fonctions/chat/calculer-zoom-pincement";
import { lireSourcePhotoChat } from "~/fonctions/chat/lire-source-photo-chat";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";
import { utiliserZoomPhoto } from "~/hooks/utiliser-zoom-photo";

export type PoigneePagePhoto = { basculerZoom: () => void; remettre: () => void };

type Props = {
  conversationId: string;
  message: MessageChatEnrichi;
  largeur: number;
  hauteur: number;
  libelle: string;
  onAppui: () => void;
  onZoom: (zoome: boolean) => void;
  ref?: Ref<PoigneePagePhoto>;
};

const ZOOM_BOUTON = 2.5;
const surIos = Platform.OS === "ios";

export function PagePhotoVisionneuse({ conversationId, message, largeur, hauteur, libelle, onAppui, onZoom, ref }: Props) {
  const media = utiliserMediaChat(conversationId, message);
  const source = media.fichier ? lireSourcePhotoChat(media.fichier) : null;
  const [fichierIllisible, setFichierIllisible] = useState<string | null>(null);
  const illisible = !!media.fichier && fichierIllisible === media.fichier;
  const defilement = useRef<ScrollView>(null);
  const zoomIos = useRef(1);
  const zoom = utiliserZoomPhoto(largeur, hauteur, onZoom);

  useImperativeHandle(
    ref,
    () => ({
      basculerZoom: () => {
        if (!surIos) return zoom.basculer();
        const vers = zoomIos.current > 1.02 ? 1 : ZOOM_BOUTON;
        const l = largeur / vers;
        const h = hauteur / vers;
        defilement.current?.scrollResponderZoomTo({ x: (largeur - l) / 2, y: (hauteur - h) / 2, width: l, height: h, animated: true });
      },
      remettre: () => {
        if (!surIos) return zoom.remettre();
        defilement.current?.scrollResponderZoomTo({ x: 0, y: 0, width: largeur, height: hauteur, animated: false });
      },
    }),
    [zoom, largeur, hauteur],
  );

  const image =
    source && !illisible ? (
      <Image source={source} contentFit="contain" accessible accessibilityLabel={libelle} onError={() => setFichierIllisible(media.fichier ?? null)} style={{ width: largeur, height: hauteur }} />
    ) : (
      <View accessible accessibilityLabel={`${libelle} : ${T.photoPartie}`} style={{ width: largeur, height: hauteur }} className="items-center justify-center gap-2">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
          {media.etat === "chargement" ? "⏳" : "📷"}
        </Text>
        {media.etat === "chargement" ? null : <Text className="font-texte-semi text-sm text-gris-nuit">{T.photoPartie}</Text>}
      </View>
    );

  if (surIos) {
    return (
      <ScrollView
        ref={defilement}
        style={{ width: largeur, height: hauteur }}
        contentContainerStyle={{ width: largeur, height: hauteur }}
        minimumZoomScale={1}
        maximumZoomScale={ZOOM_MAX}
        bouncesZoom
        centerContent
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={64}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const z = e.nativeEvent.zoomScale ?? 1;
          if (z > 1.02 !== zoomIos.current > 1.02) onZoom(z > 1.02);
          zoomIos.current = z;
        }}
      >
        <Pressable accessible={false} onPress={onAppui}>
          {image}
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View collapsable={false} {...zoom.panHandlers} style={{ width: largeur, height: hauteur, overflow: "hidden" }}>
      <Animated.View style={zoom.style}>
        <Pressable accessible={false} onPress={onAppui}>
          {image}
        </Pressable>
      </Animated.View>
    </View>
  );
}
