import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CADRE_LEGAL } from "~/contenus/legal/cadre-legal";

export const TEXTES_CADRE_LEGAL_ANGLAIS: Traduction<typeof TEXTES_CADRE_LEGAL> = {
  retourSite: "Back to the site",
  miseAJour: (date) => `Last updated: ${date}`,
  enBref: "In short",
  auSommaire: "Contents",
  hautDePage: "Back to top",
};

export const MENTIONS_TRADUCTION_COURTOISIE = {
  toutes: "This is a courtesy translation. If it differs from the French version, the French version prevails.",
  contraignante: "Only the French version is legally binding.",
};
