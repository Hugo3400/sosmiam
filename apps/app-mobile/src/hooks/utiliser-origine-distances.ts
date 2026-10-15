import { useMemo } from "react";

import { utiliserDepartVille, type DepartDistances } from "~/hooks/utiliser-depart-ville";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";

export const DEPUIS_TOI = "de toi";

export function utiliserOrigineDistances(): DepartDistances {
  const { position } = utiliserPositionActuelle();
  const ville = utiliserDepartVille();
  return useMemo(() => (position ? { depart: position, depuis: DEPUIS_TOI } : ville), [position, ville]);
}
