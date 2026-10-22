import { Image } from "expo-image";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { lireSourcePhotoChat } from "~/fonctions/chat/lire-source-photo-chat";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";

type Props = {
  conversationId: string;
  message: MessageChatEnrichi;
  largeur: number;
  hauteur: number;
  plus: number;
  libelle: string;
  onPress: () => void;
  onLongPress: () => void;
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

export function TuileAlbumChat({ conversationId, message, largeur, hauteur, plus, libelle, onPress, onLongPress, actionsLecteur }: Props) {
  const animationsReduites = useReducedMotion();
  const media = utiliserMediaChat(conversationId, message);
  const source = media.fichier ? lireSourcePhotoChat(media.fichier) : null;
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={plus > 0 ? `${libelle}, ${T.plusDePhotos(plus)}` : libelle}
      accessibilityHint="Ouvre les photos en grand"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      {...actionsLecteur}
      style={{ width: largeur, height: hauteur }}
      className="items-center justify-center overflow-hidden rounded-lg bg-ligne active:opacity-80"
    >
      {source ? (
        <Image source={source} contentFit="cover" transition={animationsReduites ? 0 : 150} style={{ width: largeur, height: hauteur }} />
      ) : (
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
          {media.etat === "expire" ? "⌛" : "📷"}
        </Text>
      )}
      {plus > 0 ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} className="items-center justify-center bg-nuit/55">
          <Text allowFontScaling={false} className="font-titre text-2xl text-lait">{`+${plus}`}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
