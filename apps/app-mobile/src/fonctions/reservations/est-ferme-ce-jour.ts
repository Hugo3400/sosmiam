import type { CreneauOuverture } from "@sos-miam/commun/types/lieu";

import { lireJourSemaine } from "~/fonctions/dates/lire-jour-semaine";

export function estFermeCeJour(ouverture: readonly CreneauOuverture[], jour: string): boolean {
  const jourSemaine = lireJourSemaine(jour);
  return !ouverture.some((creneau) => creneau.jours.includes(jourSemaine));
}
