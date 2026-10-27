import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MIAM_SAFE_PRO } from "~/contenus/miam-safe-pro";

export const TEXTES_MIAM_SAFE_PRO_ANGLAIS: Traduction<typeof TEXTES_MIAM_SAFE_PRO> = {
  meta: {
    titre: (nom: string) => `Miam Safe · ${nom}`,
    description: "Your venue's Miam Safe charter.",
  },
  chapo: "When a customer doesn't feel safe, they know they can count on your staff. The Miam Safe badge says so on your listing, free of charge.",
  traductionCourtoisie: "This is a courtesy translation. If it differs from the French version, the French version prevails. Only the French version is legally binding.",
  illisible: "Oops, the charter didn't load. Reload the page in a moment.",
  signee: (le: string | null) => (le === null ? "Your venue has signed the Miam Safe charter." : `Your venue signed the Miam Safe charter on ${le}.`),
  engagements: "What your staff commit to",
  reserveAuGerant: "Only the manager can sign or leave the charter.",
  signer: {
    bouton: "Sign the charter",
    engagement: "I've read the charter, and my staff commit to following it.",
  },
  quitter: {
    bouton: "Leave the charter",
    texte: "The badge will disappear from your listing, and silent alerts will no longer be able to reach you.",
  },
  messages: {
    caseNonCochee: "Tick the box to sign: it's your staff who are making the commitment.",
    signee: "It's signed. The Miam Safe badge now appears on your listing. Thank you to all your staff.",
    quittee: "You've left the charter. The badge has been removed from your listing.",
    erreurs: {
      "charte-retiree": "The SOS Miam team has withdrawn your venue's charter following a report. Drop us a line at bonjour@sosmiam.fr to talk about it.",
      "reserve-au-gerant": "Only the manager can sign or leave the charter.",
    },
    panne: "Oops, that didn't work. Try again in a moment.",
  },
};
