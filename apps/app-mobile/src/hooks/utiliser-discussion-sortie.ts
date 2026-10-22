import { useEffect, useMemo } from "react";

import type { MessageSortie, Sortie } from "@sos-miam/commun/types/potes";
import { listerMentionsMessage } from "~/fonctions/chat/lister-mentions-message";
import { resumerDernierMessage } from "~/fonctions/chat/resumer-dernier-message";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations, type ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { utiliserFilDiscussion } from "~/hooks/utiliser-fil-discussion";
import { utiliserLieux } from "~/hooks/utiliser-lieux";

export type MessageSortieEnrichi = MessageSortie & { systeme?: string; mentions?: string[] };

export type DiscussionSortie = {
  /** Du plus ancien au plus récent ; sans ceux que tu as signalés ni ceux des personnes bloquées */
  messages: MessageSortieEnrichi[];
  /** « interdit » : tu n'es plus dans la sortie (compte connecté) */
  envoyer: (texte: string) => ResultatEnvoiChat;
  /** Compte connecté : renvoie un message qui n'est pas parti (etat « echec ») */
  renvoyer: (messageId: string) => void;
  /** Compte connecté : il reste des messages plus anciens à lire */
  plusAnciens: boolean;
  chargerPlusAnciens: () => void;
};

const MINUTE_MS = 60_000;
const RAPPEL_AVANT_MINUTES = 60;
const TEXTE_RAPPEL_DEMO = "Rappel : c'est dans 1 h ! Bon appétit la bande.";

function ajouterRappelDemo(sortie: Sortie, messages: MessageSortieEnrichi[], maintenant: number): MessageSortieEnrichi[] {
  const debut = new Date(sortie.quand).getTime();
  if (Number.isNaN(debut) || debut <= maintenant || debut - maintenant > RAPPEL_AVANT_MINUTES * MINUTE_MS) return messages;
  const date = new Date(debut - RAPPEL_AVANT_MINUTES * MINUTE_MS).toISOString();
  const rappel: MessageSortieEnrichi = { id: `rappel-${sortie.id}`, auteur: "", texte: TEXTE_RAPPEL_DEMO, date, systeme: "rappel-sortie" };
  return [...messages, rappel].sort((a, b) => a.date.localeCompare(b.date));
}

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
      const membres = (sortie?.participants ?? []).flatMap((id) => {
        const pote = communaute.trouverPote(id);
        return pote ? [{ id, pseudo: pote.pseudo }] : [];
      });
      const messages = (sortie?.messages ?? []).map((m): MessageSortieEnrichi => {
        const mentions = listerMentionsMessage(m.texte, membres.filter((x) => x.id !== m.auteur));
        return mentions.length > 0 ? { ...m, mentions } : m;
      });
      return {
        messages: sortie ? ajouterRappelDemo(sortie, messages, Date.now()) : messages,
        envoyer: (texte) => (sortie ? communaute.envoyerMessage(sortie.id, texte) : "interdit"),
        renvoyer: () => {},
        plusAnciens: false,
        chargerPlusAnciens: () => {},
      };
    }
    const messages = (conversation?.messages ?? [])
      .filter((m) => !idsBloques.has(m.auteur))
      .map((m): MessageSortieEnrichi => ({
        id: m.id,
        auteur: m.auteur,
        texte: m.type === "texte" && !m.etat ? (m.texte ?? "") : resumerDernierMessage(m, null, m.lieuId !== undefined ? trouverLieu(m.lieuId)?.nom : undefined),
        date: m.date,
        ...(m.etat ? { etat: m.etat } : {}),
        ...(m.systeme ? { systeme: m.systeme } : {}),
        ...(m.mentions ? { mentions: m.mentions } : {}),
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
