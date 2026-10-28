import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_MIAM_SAFE_PRO } from "~/contenus/textes-ecran-pro-miam-safe";

export const TEXTES_ECRAN_MIAM_SAFE_PRO_ANGLAIS: Traduction<typeof TEXTES_ECRAN_MIAM_SAFE_PRO> = {
  retour: "Back",
  titre: "Miam Safe",
  intro: "When a customer doesn't feel safe, they know they can count on your staff. The Miam Safe badge says so on your listing, free of charge.",
  sansLieu: "Open Pro mode for your venue to see its charter.",
  reserveGerant: "Only the manager can sign or leave the charter.",
  engagement: "I've read the charter, and my staff commit to following it",
  signature: "Signing…",
  signer: "Sign the charter",
  signerIndice: "The Miam Safe badge will show on your listing",
  signerIndiceSansEngagement: "Turn on your staff's commitment first",
  avertissementQuitter: "The badge will disappear from your listing, and silent alerts can no longer be sent to you.",
  enCours: "One moment…",
  quitter: "Leave the charter",
  quitterTitre: "Leave the Miam Safe charter?",
  rester: "I'll stay",
  resterIndice: "Your venue keeps the charter and its badge",
  reussites: {
    signer: "It's signed. The Miam Safe badge now shows on your listing. Thank you to all your staff.",
    quitter: "You've left the charter. The badge no longer shows on your listing.",
  },
};
