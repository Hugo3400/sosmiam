import { useMemo } from "react";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { eliderDe } from "~/fonctions/texte/elider-de";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserProfil } from "~/hooks/utiliser-profil";

export type DepartDistances = { depart: PositionLieu | null; depuis: string | null };

export function utiliserDepartVille(): DepartDistances {
  const depart = utiliserPointDeDepart();
  const { profil } = utiliserProfil();
  const nom = profil?.ville ?? "";
  return useMemo(() => {
    const ville = depart ? trouverVilleFrance(nom) : null;
    return { depart, depuis: ville ? eliderDe(ville.nom) : null };
  }, [depart, nom]);
}
