import { DETAILS_MOTIFS_MODERATION_PAR_LANGUE, type MotifModeration } from "../../../../../packages/commun/src/contenus/motifs-moderation.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";

export function lireMotifLimitation(code: string, langue: Langue): { libelle: string; regle: string | null } {
  const motifs = DETAILS_MOTIFS_MODERATION_PAR_LANGUE[langue];
  const details = Object.hasOwn(motifs, code) ? motifs[code as MotifModeration] : null;
  return details ? { libelle: details.libelle, regle: details.regle } : { libelle: TEXTES_LIMITATION_PAR_LANGUE[langue].motifInconnu, regle: null };
}
