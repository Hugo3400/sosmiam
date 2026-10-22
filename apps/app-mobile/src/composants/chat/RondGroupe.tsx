import { Image } from "expo-image";
import { Text, View } from "react-native";

import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { utiliserPhotoGroupe } from "~/hooks/utiliser-photo-groupe";

type Props = {
  conversation: Pick<ConversationEnrichie, "id" | "type" | "emoji" | "photo" | "fichierPhoto">;
  taille: number;
};

export function RondGroupe({ conversation, taille }: Props) {
  const photo = utiliserPhotoGroupe(conversation);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2 }}
      className="items-center justify-center overflow-hidden border-2 border-encre bg-jaune-clair"
    >
      {photo ? (
        <Image source={{ uri: photo }} contentFit="cover" style={{ width: taille - 4, height: taille - 4 }} />
      ) : (
        <Text allowFontScaling={false} style={{ fontSize: taille * 0.5, lineHeight: taille * 0.64 }}>
          {conversation.emoji || "💬"}
        </Text>
      )}
    </View>
  );
}
