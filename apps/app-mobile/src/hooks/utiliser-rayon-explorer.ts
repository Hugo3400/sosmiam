import { useCallback, useEffect, useState } from "react";

import { RAYON_PROCHE_KM } from "~/contenus/portee-explorer";
import { enregistrerRayonExplorer, lireRayonExplorer } from "~/stockage/rayon-explorer";

/**
 * Le rayon d'« À quelques kilomètres » (5 km au départ), relu sur le téléphone, et de quoi le changer : il est gardé
 * pour la prochaine fois. Une valeur hors des bornes du curseur est ramenée dedans.
 */
export function utiliserRayonExplorer(): [number, (km: number) => void] {
  const [rayon, setRayon] = useState<number>(RAYON_PROCHE_KM.defaut);

  useEffect(() => {
    let actif = true;
    lireRayonExplorer().then((km) => {
      if (actif && km !== null) setRayon(km);
    });
    return () => {
      actif = false;
    };
  }, []);

  const changer = useCallback((km: number) => {
    const borne = Math.min(RAYON_PROCHE_KM.max, Math.max(RAYON_PROCHE_KM.min, Math.round(km)));
    setRayon(borne);
    enregistrerRayonExplorer(borne).catch(() => {});
  }, []);

  return [rayon, changer];
}
