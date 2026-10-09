import { choisirRecompenseAffichee } from "../../../../../packages/commun/src/fonctions/fidelite/choisir-recompense-affichee.ts";
import { estRecompenseAlcool } from "../../../../../packages/commun/src/fonctions/fidelite/est-recompense-alcool.ts";
import type { CarteFidelite } from "../../../../../packages/commun/src/types/fidelite.ts";
import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { LigneCarte, LigneProgramme } from "../../services/visites-regles.ts";

/**
 * La carte de fidélité d'une personne chez un lieu, telle qu'elle la voit : la récompense déjà choisie selon son âge (un
 * 15-17 ans ne voit que la version sans alcool, sans mention de l'autre). null sans programme, chez un bar pour un
 * mineur, ou si aucune récompense ne peut lui être montrée.
 */
export function presenterCarteFidelite(carte: LigneCarte, programme: LigneProgramme | null, lieu: LieuResume, majeur: boolean): CarteFidelite | null {
  if (!programme || (lieu.type === "bar" && !majeur)) return null;
  const recompense = choisirRecompenseAffichee(programme, majeur);
  if (recompense === null) return null;
  return {
    lieu,
    programmeActif: programme.actif,
    tampons: carte.tampons,
    sur: programme.visitesRequises,
    recompense,
    recompenseAlcool: estRecompenseAlcool(programme, majeur),
    pretes: carte.pretes.map((r) => ({ id: r.id, libelle: r.libelle, gagneeLe: r.gagneeLe.toISOString(), ...(r.alcool ? { alcool: true } : {}) })),
    demande: carte.demande
      ? { id: carte.demande.id, recompenseId: carte.demande.recompenseId, code: carte.demande.code, creeLe: carte.demande.creeLe.toISOString(), expireLe: carte.demande.expireLe.toISOString() }
      : null,
  };
}
