import { useCallback, useEffect, useState } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { PartagePositionMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { utiliserServices } from "~/hooks/utiliser-services";

/**
 * Un partage « Prévenir un pote », relu régulièrement tant qu'il est en cours (le pote voit la position bouger) :
 * `relectureMs` (10 s pour le pote, 30 s pour la personne qui partage). erreur : « partage-inconnu », « hors-ligne »…
 */
export function utiliserPartageMiamSafe(partageId: number | null, relectureMs: number) {
  const { miamSafe } = utiliserServices();
  const [partage, setPartage] = useState<PartagePositionMiamSafe | null>(null);
  const [erreur, setErreur] = useState<ErreurService | null>(null);

  const relire = useCallback(async () => {
    if (partageId === null) return;
    const r = await miamSafe.lirePartage(partageId).catch(() => null);
    if (r?.ok) {
      setPartage(r.partage);
      setErreur(null);
    } else {
      setErreur(r ? r.erreur : "hors-ligne");
    }
  }, [partageId, miamSafe]);

  useEffect(() => {
    relire();
  }, [relire]);

  const actif = partage?.actif === true;
  useEffect(() => {
    if (!actif) return;
    const minuterie = setInterval(relire, relectureMs);
    return () => clearInterval(minuterie);
  }, [actif, relectureMs, relire]);

  return { partage, erreur, relire };
}
