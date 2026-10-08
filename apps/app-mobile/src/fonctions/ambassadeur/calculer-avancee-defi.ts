import type { Defi } from "~/contenus/defis-exemples";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";

/** Où en est la personne dans un défi (0 tant que sa mesure n'est pas suivie sur le téléphone), sans dépasser l'objectif. */
export function calculerAvanceeDefi(defi: Defi, mesures: MesuresActivite): number {
  return defi.mesure ? Math.min(mesures[defi.mesure], defi.objectif) : 0;
}
