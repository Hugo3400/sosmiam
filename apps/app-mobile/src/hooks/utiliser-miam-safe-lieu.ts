import { useEffect, useState } from "react";

import type { MiamSafeLieu } from "@sos-miam/commun/types/miam-safe";
import { utiliserServices } from "~/hooks/utiliser-services";

const RIEN: MiamSafeLieu = { engage: false, repere: false };

/**
 * Miam Safe pour un lieu (charte signée, « Les Miamis s'y sentent bien »), lu par le service : la démo en développement,
 * rien dans une version publiée sans API (pas de badge plutôt qu'un faux badge), l'API plus tard.
 */
export function utiliserMiamSafeLieu(lieuId: number): MiamSafeLieu {
  const { miamSafe } = utiliserServices();
  const [etat, setEtat] = useState<{ lieuId: number; valeur: MiamSafeLieu } | null>(null);
  useEffect(() => {
    let actif = true;
    miamSafe.lireLieu(lieuId).then((r) => {
      if (actif) setEtat({ lieuId, valeur: r.ok ? { engage: r.engage, repere: r.repere } : RIEN });
    }).catch(() => {});
    return () => {
      actif = false;
    };
  }, [miamSafe, lieuId]);
  return etat?.lieuId === lieuId ? etat.valeur : RIEN;
}
