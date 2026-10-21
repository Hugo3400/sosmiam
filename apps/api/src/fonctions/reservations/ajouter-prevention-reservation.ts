import { MESSAGE_SANITAIRE_ALCOOL } from "../../../../../packages/commun/src/contenus/prevention-alcool.ts";
import { parleDAlcool } from "../../../../../packages/commun/src/fonctions/prevention/parle-d-alcool.ts";
import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";

export function ajouterPreventionReservation(texte: string, lieu: Pick<LieuResume, "nom" | "type">): string {
  return lieu.type === "bar" || parleDAlcool(lieu.nom) ? `${texte} ${MESSAGE_SANITAIRE_ALCOOL}` : texte;
}
