import { useMemo } from "react";

import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";
import type { ZonePortee } from "~/contenus/portee-explorer";
import type { FiltresExplorer } from "~/contenus/type-filtres-explorer";
import { estDansPortee } from "~/fonctions/lieux/est-dans-portee";
import { filtrerLieuxTriesExplorer } from "~/fonctions/lieux/filtrer-lieux-tries-explorer";
import { trierLieuxExplorer, type LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";

type Entrees = {
  lieux: Lieu[];
  zone: ZonePortee | null;
  filtres: FiltresExplorer;
  texte: string;
  evenementsParLieu: Map<number, EvenementLieuPublic> | null;
  maintenant: Date;
  profil: Profil | null;
  position: PositionLieu | null;
  depart: PositionLieu | null;
};

export function utiliserLieuxFiltresExplorer({ lieux, zone, filtres, texte, evenementsParLieu, maintenant, profil, position, depart }: Entrees): LieuExplorer[] {
  const { evenement, type, ville, budgets, ouvertMaintenant } = filtres;
  const tries = useMemo(() => {
    const dansLaZone = zone ? lieux.filter((l) => estDansPortee(l, zone)) : lieux;
    const avecEvenement = evenement ? dansLaZone.filter((l) => evenementsParLieu?.has(l.id) ?? false) : dansLaZone;
    return trierLieuxExplorer(avecEvenement, profil, position, depart);
  }, [lieux, zone, evenement, evenementsParLieu, profil, position, depart]);
  const ouvertA = ouvertMaintenant ? maintenant : null;
  return useMemo(() => filtrerLieuxTriesExplorer(tries, { texte, type, ville, budgets, ouvertA }), [tries, texte, type, ville, budgets, ouvertA]);
}
