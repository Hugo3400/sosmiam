import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_SUGGESTIONS_PRO } from "~/contenus/suggestions-pro";

export const TEXTES_SUGGESTIONS_PRO_ANGLAIS: Traduction<typeof TEXTES_SUGGESTIONS_PRO> = {
  meta: {
    titre: (nom: string) => `Suggested edits · ${nom}`,
    titreParDefaut: "Suggested edits",
    description: "Suggested changes to your listing.",
  },
  page: "Suggested edits",
  chapo: "A customer spots a mistake on your listing? They suggest a fix, and the SOS Miam team decides. You can see it all here.",
  illisibles: "Oops, the suggestions didn't load. Reload the page in a moment.",
  vide: {
    titre: "Nothing to report!",
    texte: "Nobody has suggested any changes to your listing. It must be spot on.",
  },
  enAttente: (nombre: number) => `Pending (${nombre})`,
  decidees: "Decided",
  carte: {
    statuts: {
      "en-attente": "The SOS Miam team is looking",
      acceptee: "Accepted ✓",
      partielle: "Partly accepted",
      refusee: "Declined",
    },
    client: "A customer suggests",
    toi: "Your request",
    le: "On ",
    decideeLe: " · decided on ",
    accepte: " · accepted ✓",
    pasRetenu: " · not kept",
    avant: "Before: ",
    apres: ", after: ",
    pourquoi: "Why: ",
    motEquipe: "A note from the SOS Miam team: ",
  },
};
