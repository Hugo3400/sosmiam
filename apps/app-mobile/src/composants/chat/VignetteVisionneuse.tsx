import { Image } from "expo-image";
import { Pressable } from "react-native";

import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { lireSourcePhotoChat } from "~/fonctions/chat/lire-source-photo-chat";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";

type Props = {
  conversationId: string;
  message: MessageChatEnrichi;
  choisie: boolean;
  numero: number;
  total: number;
  onPress: () => void;
};

const TAILLE_VIGNETTE = 48;

export function VignetteVisionneuse({ conversationId, message, choisie, numero, total, onPress }: Props) {
  const media = utiliserMediaChat(conversationId, message);
  const source = media.fichier ? lireSourcePhotoChat(media.fichier) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={T.voirPhoto(numero, total)}
      accessibilityState={{ selected: choisie }}
      onPress={onPress}
      style={{ width: TAILLE_VIGNETTE, height: TAILLE_VIGNETTE }}
      className={`overflow-hidden rounded-lg border-2 bg-trait-nuit active:opacity-80 ${choisie ? "border-jaune" : "border-transparent"}`}
    >
      {source ? <Image source={source} contentFit="cover" style={{ flex: 1 }} /> : null}
    </Pressable>
  );
}
