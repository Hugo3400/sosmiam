import { useMemo } from "react";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { ecrireDepuisVille } from "~/fonctions/geo/ecrire-depuis-ville";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserProfil } from "~/hooks/utiliser-profil";

export type DepartDistances = { depart: PositionLieu | null; depuis: string | null };

export function utiliserDepartVille(): DepartDistances {
  const depart = utiliserPointDeDepart();
  const { profil } = utiliserProfil();
  const { langue } = utiliserLangue();
  const nom = profil?.ville ?? "";
  return useMemo(() => ({ depart, depuis: depart ? ecrireDepuisVille(nom, langue) : null }), [depart, nom, langue]);
}
