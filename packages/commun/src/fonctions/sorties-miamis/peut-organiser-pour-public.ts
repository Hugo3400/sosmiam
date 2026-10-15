import type { ProfilVisibiliteMiamis, PublicSortieMiamis } from "../../types/sorties-miamis.ts";
import { peutVoirSortieMiamis } from "./peut-voir-sortie-miamis.ts";

export function peutOrganiserPourPublic(publicSortie: PublicSortieMiamis, profil: ProfilVisibiliteMiamis): boolean {
  if (publicSortie.type === "nouveaux") return true;
  return peutVoirSortieMiamis(publicSortie, profil);
}
