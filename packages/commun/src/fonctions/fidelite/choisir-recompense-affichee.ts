import type { ReglageFidelite } from "../../types/fidelite.ts";
import { contientMotAlcool } from "./contient-mot-alcool.ts";

/**
 * La récompense qu'on montre. Avec un compte (18 ans ou plus), toujours la récompense principale, alcool compris (avec le
 * message sanitaire). En visite sans compte (âge inconnu), jamais la version avec alcool, et rien ne lui en fait mention :
 * la version sans alcool si le lieu en a prévu une (elle est facultative), sinon rien (null).
 * Par prudence, une récompense qui contient un mot d'alcool est traitée comme alcoolisée même si la case n'est pas
 * cochée (programme enregistré avant la validation), et une version « sans alcool » qui en contient un est écartée.
 */
export function choisirRecompenseAffichee(
  p: Pick<ReglageFidelite, "recompense" | "alcool" | "recompenseSansAlcool">,
  avecCompte: boolean,
): string | null {
  const alcool = p.alcool || contientMotAlcool(p.recompense);
  if (!alcool || avecCompte) return p.recompense;
  const sansAlcool = p.recompenseSansAlcool?.trim() ?? "";
  if (sansAlcool === "" || contientMotAlcool(sansAlcool)) return null;
  return sansAlcool;
}
