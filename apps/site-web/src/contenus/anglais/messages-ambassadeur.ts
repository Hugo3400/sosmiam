import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MESSAGES_AMBASSADEUR } from "~/contenus/messages-ambassadeur";

export const TEXTES_MESSAGES_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_MESSAGES_AMBASSADEUR> = {
  meta: { titre: "My messages", description: "Messages from the SOS Miam team." },
  titre: "My messages",
  chapo: "News from the SOS Miam team.",
  nonLus: (nombre: number) => ` ${nombre} unread.`,
  aucun: "No messages for now. When the team writes to you, this is where it lands.",
  reponses: {
    lu: "Noted: message marked as read.",
    introuvable: "This message doesn't exist any more.",
    panne: "Oops, that didn't work. Try again in a moment.",
  },
  carte: {
    nouveau: "New",
    recuLe: "Received on ",
    luLe: "Read on ",
    marquer: "Mark as read",
    pourLecteurs: (titre: string) => `: ${titre}`,
  },
};
