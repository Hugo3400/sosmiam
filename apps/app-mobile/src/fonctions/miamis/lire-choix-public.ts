import type { PublicSortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import type { ChoixPublicSortie } from "~/contenus/textes-sorties-miamis";

export function lireChoixPublic(publicSortie: PublicSortieMiamis): ChoixPublicSortie {
  return publicSortie.type === "genre" ? publicSortie.genre : publicSortie.type;
}
