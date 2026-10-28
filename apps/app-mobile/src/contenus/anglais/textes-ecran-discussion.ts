import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_DISCUSSION } from "~/contenus/textes-ecran-discussion";

export const TEXTES_ECRAN_DISCUSSION_ANGLAIS: Traduction<typeof TEXTES_ECRAN_DISCUSSION> = {
  retour: "Back",
  retourMessages: "Back to my messages",
  plusPersonneTitre: "Nobody on the other end",
  plusPersonneTexte: "This chat isn't here any more – maybe you left the group, or blocked the person. Your other friends are still waiting for you!",
  plusLesMessagesDe: (prenom: string) => `🚫 Done – you won't see ${prenom}'s messages any more`,
  bloque: (prenom: string) => `Done – you've blocked ${prenom}.`,
  quitte: (titre: string) => `You've left ${titre}.`,
  enPause: "Chat on hold",
  enPauseTitre: "🛡️ Chat on hold",
  plusSurSosMiam: "This person isn't on SOS Miam any more. You can reread your messages, but you can't send them new ones.",
  plusDansBande: (prenom: string) => `${prenom} isn't in your crew any more. Your messages are still here, but to write to each other again, you'll need to add each other first.`,
  voirProfil: (prenom: string) => `See ${prenom}'s profile`,
  quelquun: "Someone",
  creePar: "you",
  messages: "Messages",
  messagesNonLus: (nonLus: number) => `Messages, ${nonLus} unread`,
  messagesIntro: "One-to-one or in a group, with your crew. The best yum plans start with a “hungry?”.",
};
