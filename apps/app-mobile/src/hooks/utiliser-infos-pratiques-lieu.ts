import { useEffect, useState } from "react";

import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { utiliserServices } from "~/hooks/utiliser-services";

/**
 * Les infos pratiques à afficher sur la fiche : celles que le lieu a remplies lui-même (mode pro, espace pro) si elles
 * existent, sinon celles de la fiche. Relues quand le lieu change, puis à chaque changement signalé par les services. Sans
 * lieu (pas encore lu, ou absent), rien n'est lu.
 */
export function utiliserInfosPratiquesLieu(lieu: Lieu | undefined): InfosPratiques | undefined {
  const { visites } = utiliserServices();
  const [remplies, setRemplies] = useState<InfosPratiques | null>(null);

  const lieuId = lieu?.id;
  useEffect(() => {
    if (lieuId === undefined) return;
    let actif = true;
    const lire = () =>
      visites.lireLieu(lieuId).then((r) => {
        if (actif) setRemplies(r.ok ? r.infos.pratique : null);
      });
    lire();
    const desabonner = visites.ecouter(lire);
    return () => {
      actif = false;
      desabonner();
    };
  }, [visites, lieuId]);

  return remplies ?? lieu?.pratique;
}
