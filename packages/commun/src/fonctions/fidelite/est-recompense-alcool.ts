import type { ReglageFidelite } from "../../types/fidelite.ts";
import { contientMotAlcool } from "./contient-mot-alcool.ts";

/**
 * Vrai si la récompense principale contient de l'alcool : le message sanitaire va avec. Par prudence, une récompense
 * qui contient un mot d'alcool compte, case cochée ou non (programme enregistré avant la validation).
 */
export function estRecompenseAlcool(p: Pick<ReglageFidelite, "recompense" | "alcool">): boolean {
  return p.alcool || contientMotAlcool(p.recompense);
}
