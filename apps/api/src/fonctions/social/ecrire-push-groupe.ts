import type { MessagePush } from "../../services/notifications/expedier-push.ts";

/**
 * La notification d'une invitation à rejoindre un groupe, sur le téléphone (décidé par Hugo le 14/10/2026 : elle sonne,
 * comme une invitation à une sortie). Le prénom de celui qui invite et le titre du groupe, comme pour les messages d'un
 * groupe ; jamais un texte de message. Le lien ouvre les discussions de l'app, où l'invitation attend la réponse.
 */
export function ecrirePushGroupe(e: { prenom: string; titre: string | null }): MessagePush {
  return {
    titre: `💬 ${e.prenom} t'invite dans un groupe`,
    texte: e.titre ? `« ${e.titre} » : tu les rejoins ? Réponds dans Potes.` : "Tu les rejoins ? Réponds dans Potes.",
    lien: "/potes/messages",
  };
}
