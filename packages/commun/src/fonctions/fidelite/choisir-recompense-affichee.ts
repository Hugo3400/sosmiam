import type { ReglageFidelite } from "../../types/fidelite.ts";
import { contientMotAlcool } from "./contient-mot-alcool.ts";

/**
 * La récompense qu'on montre à une personne, selon son âge. Un 15-17 ans ne reçoit jamais la version avec alcool, et
 * rien ne lui en fait mention : il voit la version sans alcool, ou rien (null) si le lieu n'en a pas prévu.
 * Par prudence, une récompense qui contient un mot d'alcool est traitée comme alcoolisée même si la case n'est pas
 * cochée (programme enregistré avant la validation), et une version « sans alcool » qui en contient un est écartée.
 */
export function choisirRecompenseAffichee(
  p: Pick<ReglageFidelite, "recompense" | "alcool" | "recompenseSansAlcool">,
  majeur: boolean,
): string | null {
  const alcool = p.alcool || contientMotAlcool(p.recompense);
  if (!alcool || majeur) return p.recompense;
  const sansAlcool = p.recompenseSansAlcool?.trim() ?? "";
  if (sansAlcool === "" || contientMotAlcool(sansAlcool)) return null;
  return sansAlcool;
}
