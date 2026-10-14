import type { MessagePush } from "../../services/notifications/expedier-push.ts";

/** Ce qui arrive à une sortie et mérite une notification sur le téléphone (spécification sociale C.5) */
export type EvenementPushSortie =
  | { quoi: "invitation"; prenom: string; titre: string; sortieId: number }
  | { quoi: "lieu-choisi"; titre: string; lieu: string; sortieId: number };

/**
 * La notification d'une sortie sur le téléphone : l'invitation (« 🎉 Léa t'invite : Pizza du jeudi ») et le lieu retenu
 * (« 🗳️ C'est voté ! »). Le lien n'ouvre qu'un écran de l'app (règle du 8 octobre). Le titre d'une sortie est en clair
 * (spécification A.0 : la cloche et la tâche de la minute en ont besoin) ; jamais un texte de message.
 */
export function ecrirePushSortie(e: EvenementPushSortie): MessagePush {
  const lien = `/potes/sortie/${e.sortieId}`;
  if (e.quoi === "invitation") return { titre: `🎉 ${e.prenom} t'invite : ${e.titre}`, texte: "Tu viens ? Réponds-lui dans Potes.", lien };
  return { titre: "🗳️ C'est voté !", texte: `${e.titre} : rendez-vous chez ${e.lieu}.`, lien };
}
