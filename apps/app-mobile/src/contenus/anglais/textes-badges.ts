import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_BADGES } from "~/contenus/textes-badges";

export const TEXTES_BADGES_ANGLAIS: Traduction<typeof TEXTES_BADGES> = {
  titre: "Your badges",
  retour: "Back to profile",
  sousTitre: (obtenus: number, total: number) => `${obtenus} of ${total}: ${total - obtenus} more to unlock – happy hunting!`,
  collectionComplete: "Full collection – the Brigade's lost for words!",
  aide: "Tap a badge to find out how to earn it.",
  attenteReseau: "Your badges will land as soon as you're back online. We're keeping them warm for you!",
  sansSession: "Log in to your account to see your badges.",
  compteFamille: (obtenus: number, total: number) => ({ texte: `${obtenus}/${total}`, lu: `${obtenus} of ${total}` }),
  obtenu: "Earned",
  possible: "Ready to unlock – you can start right now!",
};
