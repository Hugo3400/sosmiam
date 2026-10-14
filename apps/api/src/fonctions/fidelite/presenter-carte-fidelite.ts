import { estRecompenseAlcool } from "../../../../../packages/commun/src/fonctions/fidelite/est-recompense-alcool.ts";
import type { CarteFidelite } from "../../../../../packages/commun/src/types/fidelite.ts";
import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { LigneCarte, LigneProgramme } from "../../services/visites-regles.ts";

/**
 * La carte de fidélité d'une personne chez un lieu, telle qu'elle la voit : la récompense principale du programme, avec
 * `recompenseAlcool` pour le message sanitaire (la fidélité demande un compte, donc 18 ans ou plus). null sans programme.
 */
export function presenterCarteFidelite(carte: LigneCarte, programme: LigneProgramme | null, lieu: LieuResume): CarteFidelite | null {
  if (!programme) return null;
  return {
    lieu,
    programmeActif: programme.actif,
    tampons: carte.tampons,
    sur: programme.visitesRequises,
    recompense: programme.recompense,
    recompenseAlcool: estRecompenseAlcool(programme),
    pretes: carte.pretes.map((r) => ({ id: r.id, libelle: r.libelle, gagneeLe: r.gagneeLe.toISOString(), ...(r.alcool ? { alcool: true } : {}) })),
    demande: carte.demande
      ? { id: carte.demande.id, recompenseId: carte.demande.recompenseId, code: carte.demande.code, creeLe: carte.demande.creeLe.toISOString(), expireLe: carte.demande.expireLe.toISOString() }
      : null,
  };
}
