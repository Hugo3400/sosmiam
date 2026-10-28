import { useMemo } from "react";

import { TEXTES_DISTANCES, TEXTES_DISTANCES_PAR_LANGUE } from "~/contenus/textes-distances";
import { utiliserDepartVille, type DepartDistances } from "~/hooks/utiliser-depart-ville";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export const DEPUIS_TOI = TEXTES_DISTANCES.depuisToi;

export function utiliserOrigineDistances(): DepartDistances {
  const { position } = utiliserPositionActuelle();
  const ville = utiliserDepartVille();
  const { depuisToi } = utiliserTextes(TEXTES_DISTANCES_PAR_LANGUE);
  return useMemo(() => (position ? { depart: position, depuis: depuisToi } : ville), [position, ville, depuisToi]);
}
