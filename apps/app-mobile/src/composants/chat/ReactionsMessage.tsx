import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { REACTIONS_CHAT, type MessageChat } from "@sos-miam/commun/types/conversations";
import { TEXTES_CHAT_BULLES_PAR_LANGUE } from "~/contenus/textes-chat-bulles";
import { decrireReactionChat } from "~/fonctions/chat/decrire-reaction-chat";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  conversationId: string;
  message: MessageChat;
  /** Ton message : les puces se rangent à droite, sous ta bulle */
  deMoi: boolean;
  centre?: boolean;
};

/**
 * Les réactions sous une bulle : « ❤️ 2 », la tienne entourée. Toucher une puce met ou retire ta réaction.
 * Les personnes bloquées ne comptent pas.
 */
export function ReactionsMessage({ conversationId, message, deMoi, centre = false }: Props) {
  const { basculerReaction } = utiliserConversations();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CHAT_BULLES_PAR_LANGUE);
  const { bloques } = utiliserCommunaute();
  const monId = utiliserMonId();
  const bloquesIds = useMemo(() => new Set(bloques.map((p) => p.id)), [bloques]);

  const puces = REACTIONS_CHAT.flatMap((reaction) => {
    const qui = (message.reactions[reaction] ?? []).filter((id) => !bloquesIds.has(id));
    return qui.length > 0 ? [{ reaction, nombre: qui.length, dontMoi: qui.includes(monId) }] : [];
  });
  if (puces.length === 0) return null;

  return (
    <View className={`mt-1 flex-row flex-wrap gap-1 ${centre ? "justify-center self-center" : deMoi ? "justify-end self-end" : "self-start"}`}>
      {puces.map(({ reaction, nombre, dontMoi }) => (
        <Pressable
          key={reaction}
          accessibilityRole="button"
          accessibilityState={{ selected: dontMoi }}
          accessibilityLabel={decrireReactionChat(reaction, nombre, dontMoi, langue)}
          accessibilityHint={dontMoi ? T.retireReaction : T.reagisPareil}
          hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
          onPress={() => {
            vibrerLegerement();
            basculerReaction(conversationId, message.id, reaction);
          }}
          className={`min-h-8 flex-row items-center gap-1 rounded-full px-2.5 active:opacity-70 ${
            dontMoi ? "border-2 border-encre bg-jaune-clair" : "border border-ligne bg-carte"
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
