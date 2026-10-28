import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { utiliserConversations } from "~/hooks/utiliser-conversations";

/**
 * Tant que l'écran d'une discussion est au premier plan, ses messages sont lus puis relus régulièrement (compte connecté :
 * toutes les 5 s pendant une minute, puis toutes les 15 s). Écran quitté ou recouvert : ça s'arrête.
 */
export function utiliserFilDiscussion(conversationId: string): void {
  const { suivreFil } = utiliserConversations();
  useFocusEffect(useCallback(() => (conversationId ? suivreFil(conversationId) : undefined), [conversationId, suivreFil]));
}
