import { useEffect, useMemo } from "react";

import type { MessageSortie, Sortie } from "@sos-miam/commun/types/potes";
import { resumerDernierMessage } from "~/fonctions/chat/resumer-dernier-message";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations, type ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { utiliserFilDiscussion } from "~/hooks/utiliser-fil-discussion";
import { utiliserLieux } from "~/hooks/utiliser-lieux";

export type DiscussionSortie = {
  /** Du plus ancien au plus récent ; sans ceux que tu as signalés ni ceux des personnes bloquées */
  messages: MessageSortie[];
  /** « interdit » : tu n'es plus dans la sortie (compte connecté) */
  envoyer: (texte: string) => ResultatEnvoiChat;
  /** Compte connecté : renvoie un message qui n'est pas parti (etat « echec ») */
  renvoyer: (messageId: string) => void;
  /** Compte connecté : il reste des messages plus anciens à lire */
  plusAnciens: boolean;
  chargerPlusAnciens: () => void;
};

/**
 * La discussion d'une sortie, la même pour l'écran en démo et avec un compte. Démo : les messages gardés dans la sortie.
 * Compte connecté : sa conversation dans la messagerie (sortie.conversationId), lue puis relue tant que l'écran est au
 * premier plan, marquée lue à chaque nouveau message. Une photo, une note ou un lieu s'y résument en une ligne.
 */
export function utiliserDiscussionSortie(sortie: Sortie | null): DiscussionSortie {
  const communaute = utiliserCommunaute();
  const conversations = utiliserConversations();
  const { trouverLieu } = utiliserLieux();
  const conversationId = sortie?.conversationId ?? "";
  utiliserFilDiscussion(conversationId);
  const conversation = conversationId ? conversations.trouverConversation(conversationId) : null;
  const dernier = conversation?.messages[conversation.messages.length - 1]?.id;
  const { marquerLu } = conversations;

  // Un nouveau message arrive pendant que la discussion est ouverte : il est lu
  useEffect(() => {
    if (conversationId && dernier) marquerLu(conversationId);
    // marquerLu change à chaque relecture : seulement quand le dernier message change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, dernier]);

  const idsBloques = useMemo(() => new Set(communaute.bloques.map((p) => p.id)), [communaute.bloques]);

  return useMemo((): DiscussionSortie => {
    if (!sortie || !conversationId) {
      return {
        messages: sortie?.messages ?? [],
        envoyer: (texte) => (sortie ? communaute.envoyerMessage(sortie.id, texte) : "interdit"),
        renvoyer: () => {},
        plusAnciens: false,
        chargerPlusAnciens: () => {},
      };
    }
    const messages = (conversation?.messages ?? [])
      .filter((m) => !idsBloques.has(m.auteur))
      .map((m): MessageSortie => ({
        id: m.id,
        auteur: m.auteur,
        texte: m.type === "texte" && !m.etat ? (m.texte ?? "") : resumerDernierMessage(m, null, m.lieuId !== undefined ? trouverLieu(m.lieuId)?.nom : undefined),
        date: m.date,
        ...(m.etat ? { etat: m.etat } : {}),
      }));
    return {
      messages,
      envoyer: (texte) => conversations.envoyerTexte(conversationId, texte),
      renvoyer: (messageId) => conversations.renvoyer(conversationId, messageId),
      plusAnciens: conversation?.plusAnciens === true,
      chargerPlusAnciens: () => conversations.chargerPlusAnciens(conversationId),
    };
  }, [sortie, conversationId, conversation, idsBloques, communaute, conversations, trouverLieu]);
}
