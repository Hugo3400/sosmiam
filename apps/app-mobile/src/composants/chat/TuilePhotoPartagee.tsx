import { Image } from "expo-image";
import { Pressable, Text } from "react-native";

import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { lireSourcePhotoChat } from "~/fonctions/chat/lire-source-photo-chat";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";

type Props = {
  conversationId: string;
  message: MessageChatEnrichi;
  taille: number;
  libelle: string;
  onPress: () => void;
};

export function TuilePhotoPartagee({ conversationId, message, taille, libelle, onPress }: Props) {
  const media = utiliserMediaChat(conversationId, message);
  const source = media.fichier ? lireSourcePhotoChat(media.fichier) : null;
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={libelle}
      accessibilityHint="Ouvre la photo en grand"
      onPress={onPress}
      style={{ width: taille, height: taille }}
      className="items-center justify-center overflow-hidden rounded-lg bg-ligne active:opacity-80"
    >
      {source ? (
        <Image source={source} contentFit="cover" style={{ width: taille, height: taille }} />
      ) : (
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
          {media.etat === "expire" ? "⌛" : "📷"}
        </Text>
      )}
    </Pressable>
  );
}
