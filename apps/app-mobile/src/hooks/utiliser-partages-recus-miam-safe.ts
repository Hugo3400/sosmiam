import { useEffect, useState } from "react";

import type { PartagePositionMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";
import { utiliserServices } from "~/hooks/utiliser-services";

/** On relit les partages reçus toutes les 30 s (le serveur en accepte 30 lectures par minute) */
const RELECTURE_MS = 30_000;

/**
 * « Prévenir un pote » : les partages de position en cours qu'un pote t'a envoyés, relus toutes les 30 s et à chaque retour
 * de l'app au premier plan. Seulement avec un compte connecté ; vide sinon.
 */
export function utiliserPartagesRecusMiamSafe(): PartagePositionMiamSafe[] {
  const { miamSafe } = utiliserServices();
  const { source } = utiliserCommunaute();
  const retours = utiliserRetoursPremierPlan();
  const [recus, setRecus] = useState<PartagePositionMiamSafe[]>([]);

  useEffect(() => {
    if (source !== "compte") {
      setRecus([]);
      return;
    }
    let annule = false;
    const relire = () =>
      miamSafe.listerPartages()
        .then((r) => !annule && r.ok && setRecus(r.partages.filter((p) => p.sens === "recu" && p.actif)))
        .catch(() => {});
    relire();
    const minuterie = setInterval(relire, RELECTURE_MS);
    return () => {
      annule = true;
      clearInterval(minuterie);
    };
  }, [source, miamSafe, retours]);

  return recus;
}
