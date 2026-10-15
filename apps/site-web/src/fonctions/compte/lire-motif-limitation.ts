import { DETAILS_MOTIFS_MODERATION, type MotifModeration } from "../../../../../packages/commun/src/contenus/motifs-moderation.ts";

/**
 * Le motif d'une limitation en clair : son nom (« Haine ou harcèlement ») et la règle des CGU mot pour mot. Un code
 * inconnu (une API plus récente que le site) : un nom général, sans règle.
 */
export function lireMotifLimitation(code: string): { libelle: string; regle: string | null } {
  const details = Object.hasOwn(DETAILS_MOTIFS_MODERATION, code) ? DETAILS_MOTIFS_MODERATION[code as MotifModeration] : null;
  return details ? { libelle: details.libelle, regle: details.regle } : { libelle: "Une règle de la communauté", regle: null };
}
