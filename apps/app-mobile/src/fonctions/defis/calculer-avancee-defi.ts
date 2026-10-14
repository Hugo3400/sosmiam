import type { DefiExemple } from "~/contenus/defis-exemples";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";

/** Démo : où en est la personne dans un défi d'exemple (0 tant que sa mesure n'est pas suivie sur le téléphone), sans dépasser l'objectif. */
export function calculerAvanceeDefi(defi: DefiExemple, mesures: MesuresActivite): number {
  return defi.mesure ? Math.min(mesures[defi.mesure], defi.objectif) : 0;
}
