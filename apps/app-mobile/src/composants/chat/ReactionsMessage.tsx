import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { REACTIONS_CHAT, type MessageChat } from "@sos-miam/commun/types/conversations";
import { decrireReactionChat } from "~/fonctions/chat/decrire-reaction-chat";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

type Props = {
  conversationId: string;
  message: MessageChat;
  /** Ton message : les puces se rangent à droite, sous ta bulle */
  deMoi: boolean;
};

/**
 * Les réactions sous une bulle : « ❤️ 2 », la tienne entourée. Toucher une puce met ou retire ta réaction.
 * Les personnes bloquées ne comptent pas.
 */
export function ReactionsMessage({ conversationId, message, deMoi }: Props) {
  const { basculerReaction } = utiliserConversations();
  const { bloques } = utiliserCommunaute();
  const bloquesIds = useMemo(() => new Set(bloques.map((p) => p.id)), [bloques]);

  const puces = REACTIONS_CHAT.flatMap((reaction) => {
    const qui = (message.reactions[reaction] ?? []).filter((id) => !bloquesIds.has(id));
    return qui.length > 0 ? [{ reaction, nombre: qui.length, dontMoi: qui.includes(ID_MOI) }] : [];
  });
  if (puces.length === 0) return null;

  return (
    <View className={`mt-1 flex-row flex-wrap gap-1 ${deMoi ? "justify-end self-end" : "self-start"}`}>
      {puces.map(({ reaction, nombre, dontMoi }) => (
        <Pressable
          key={reaction}
          accessibilityRole="button"
          accessibilityState={{ selected: dontMoi }}
          accessibilityLabel={decrireReactionChat(reaction, nombre, dontMoi)}
          accessibilityHint={dontMoi ? "Retire ta réaction" : "Réagis pareil"}
          hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
          onPress={() => {
            vibrerLegerement();
            basculerReaction(conversationId, message.id, reaction);
          }}
          className={`min-h-8 flex-row items-center gap-1 rounded-full px-2.5 active:opacity-70 ${
            dontMoi ? "border-2 border-encre bg-jaune-clair" : "border border-ligne bg-white"
          }`}
        >
          {/* Taille fixe : la puce reste petite sous la bulle, même avec un grand texte dans les réglages */}
          <Text allowFontScaling={false} className="text-[15px]">
            {reaction}
          </Text>
          {nombre > 1 ? <Text className={`font-texte-semi text-[13px] ${dontMoi ? "text-encre" : "text-gris"}`}>{nombre}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}
