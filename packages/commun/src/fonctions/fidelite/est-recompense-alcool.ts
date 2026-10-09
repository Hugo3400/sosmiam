import type { ReglageFidelite } from "../../types/fidelite.ts";
import { contientMotAlcool } from "./contient-mot-alcool.ts";

/**
 * Vrai si la récompense montrée à cette personne est la version avec alcool : le message sanitaire va avec. Un majeur voit
 * toujours la récompense principale (choisirRecompenseAffichee) ; un 15-17 ans jamais celle avec alcool. Même prudence que
 * pour le choix : une récompense qui contient un mot d'alcool compte, case cochée ou non.
 */
export function estRecompenseAlcool(p: Pick<ReglageFidelite, "recompense" | "alcool">, majeur: boolean): boolean {
  return majeur && (p.alcool || contientMotAlcool(p.recompense));
}
