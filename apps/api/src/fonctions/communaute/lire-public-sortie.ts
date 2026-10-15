import { TRANCHES_AGE } from "../../../../../packages/commun/src/regles/sorties-miamis.ts";
import type { Genre } from "../../../../../packages/commun/src/types/genre.ts";
import type { PublicSortieMiamis, TrancheAge } from "../../../../../packages/commun/src/types/sorties-miamis.ts";

const GENRES: readonly Genre[] = ["femme", "homme", "autre"];

export function lirePublicSortie(type: string, valeur: string | null): PublicSortieMiamis {
  if (type === "genre" && GENRES.includes(valeur as Genre)) return { type: "genre", genre: valeur as Genre };
  if (type === "age" && TRANCHES_AGE.includes(valeur as TrancheAge)) return { type: "age", tranche: valeur as TrancheAge };
  if (type === "nouveaux" || type === "ambassadeurs" || type === "tous") return { type };
  return { type: "ambassadeurs" };
}
