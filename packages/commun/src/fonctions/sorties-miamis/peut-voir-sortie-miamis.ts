import type { ProfilVisibiliteMiamis, PublicSortieMiamis } from "../../types/sorties-miamis.ts";
import { estDansTrancheAge } from "./est-dans-tranche-age.ts";

export function peutVoirSortieMiamis(publicSortie: PublicSortieMiamis, profil: ProfilVisibiliteMiamis): boolean {
  switch (publicSortie.type) {
    case "tous":
      return true;
    case "genre":
      return profil.genre === publicSortie.genre;
    case "age":
      return profil.age !== null && estDansTrancheAge(profil.age, publicSortie.tranche);
    case "nouveaux":
      return profil.nouveau;
    case "ambassadeurs":
      return profil.ambassadeur;
  }
}
