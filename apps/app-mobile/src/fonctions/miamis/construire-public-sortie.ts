import type { PublicSortieMiamis, TrancheAge } from "@sos-miam/commun/types/sorties-miamis";
import type { ChoixPublicSortie } from "~/contenus/textes-sorties-miamis";

export function construirePublicSortie(choix: ChoixPublicSortie, tranche: TrancheAge): PublicSortieMiamis {
  if (choix === "femme" || choix === "homme" || choix === "autre") return { type: "genre", genre: choix };
  if (choix === "age") return { type: "age", tranche };
  return { type: choix };
}
