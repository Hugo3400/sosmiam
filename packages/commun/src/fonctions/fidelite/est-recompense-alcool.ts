import type { ReglageFidelite } from "../../types/fidelite.ts";
import { contientMotAlcool } from "./contient-mot-alcool.ts";

/**
 * Vrai si la récompense montrée (choisirRecompenseAffichee) est la version avec alcool : le message sanitaire va avec.
 * Même prudence que pour le choix : une récompense qui contient un mot d'alcool compte, case cochée ou non.
 */
export function estRecompenseAlcool(p: Pick<ReglageFidelite, "recompense" | "alcool">, affichee: string | null): boolean {
  return affichee !== null && affichee === p.recompense && (p.alcool || contientMotAlcool(p.recompense));
}
