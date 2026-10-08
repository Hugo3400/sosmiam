import { useMemo } from "react";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { utiliserProfil } from "~/hooks/utiliser-profil";

/**
 * Point de départ des distances quand on n'a pas la position du téléphone : le centre de ta ville (partout en France),
 * ou null si ta ville n'est pas dans notre liste (on garde alors les distances d'exemple).
 */
export function utiliserPointDeDepart(): PositionLieu | null {
  const { profil } = utiliserProfil();
  const ville = profil?.ville ?? "";
  return useMemo(() => {
    const trouvee = trouverVilleFrance(ville);
    return trouvee ? { latitude: trouvee.latitude, longitude: trouvee.longitude } : null;
  }, [ville]);
}
