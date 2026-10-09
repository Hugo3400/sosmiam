import type { RaisonRelecture } from "../../../../../packages/commun/src/types/avis.ts";
import { COMPTE_NEUF_MS, NOTES_TRANCHEES, RAFALE_SEUIL, TIRAGE_RELECTURE_SUR } from "../../services/avis-regles.ts";

/**
 * Pourquoi un nouvel avis part en relecture, ou null : une rafale de notes tranchées sur ce lieu (avec lui, 3 ou plus en
 * 24 h), sinon un compte de moins de 7 jours, sinon un tirage au sort (1 sur 20 ; `tirer` n'est appelé qu'en dernier).
 * `tranchesRecents` : les avis aux notes tranchées (1 ou 5) écrits sur ce lieu ces dernières 24 h, sans celui-ci.
 */
export function choisirRaisonRelecture(e: {
  note: number;
  tranchesRecents: number;
  compteCreeLe: Date;
  maintenant: Date;
  tirer: (max: number) => number;
}): RaisonRelecture | null {
  if (NOTES_TRANCHEES.includes(e.note) && e.tranchesRecents + 1 >= RAFALE_SEUIL) return "rafale-notes";
  if (e.maintenant.getTime() - e.compteCreeLe.getTime() < COMPTE_NEUF_MS) return "compte-neuf";
  return e.tirer(TIRAGE_RELECTURE_SUR) === 0 ? "tirage" : null;
}
