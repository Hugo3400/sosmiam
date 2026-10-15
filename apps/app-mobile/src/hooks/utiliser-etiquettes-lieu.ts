import { useCallback, useEffect, useMemo, useState } from "react";

import { ajouterPropositionEtiquette } from "@sos-miam/commun/fonctions/etiquettes/ajouter-proposition-etiquette";
import { trierEtiquettesLieu } from "@sos-miam/commun/fonctions/etiquettes/trier-etiquettes-lieu";
import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";
import { ETIQUETTES_LIEUX_EXEMPLES } from "~/contenus/etiquettes-lieux-exemples";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { ajouterEtiquetteProposee, lireEtiquettesProposees } from "~/stockage/etiquettes-proposees";

export type EtiquettesDuLieu = {
  disponible: boolean;
  etiquettes: EtiquetteLieu[];
  proposer: (nom: string) => Promise<void>;
};

export function utiliserEtiquettesLieu(lieuId: number): EtiquettesDuLieu {
  const [miennes, setMiennes] = useState<string[]>([]);

  useEffect(() => {
    if (!DEMO_VISITES_ACTIVE) return;
    let actif = true;
    void lireEtiquettesProposees(lieuId).then((noms) => {
      if (actif) setMiennes(noms);
    });
    return () => {
      actif = false;
    };
  }, [lieuId]);

  const etiquettes = useMemo(() => {
    if (!DEMO_VISITES_ACTIVE) return [];
    const depart = ETIQUETTES_LIEUX_EXEMPLES[lieuId] ?? [];
    return trierEtiquettesLieu(miennes.reduce<readonly EtiquetteLieu[]>((liste, nom) => ajouterPropositionEtiquette(liste, nom), depart));
  }, [lieuId, miennes]);

  const proposer = useCallback(
    async (nom: string) => {
      setMiennes((avant) => (avant.includes(nom) ? avant : [...avant, nom]));
      await ajouterEtiquetteProposee(lieuId, nom);
    },
    [lieuId],
  );

  return { disponible: DEMO_VISITES_ACTIVE, etiquettes, proposer };
}
