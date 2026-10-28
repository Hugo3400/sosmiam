import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { DATES_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client-dates";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";

export function ecrireQuandReservation(creneau: string, maintenantMs: number, langue: Langue): string {
  const lu = decrireCreneauReservation(creneau, maintenantMs, langue).lu;
  if (langue !== "en") return lu.charAt(0).toLocaleLowerCase("fr-FR") + lu.slice(1);
  const T = choisirTextes(DATES_RESERVATION_PAR_LANGUE, langue);
  const relatif = [T.aujourdhui, T.demain, T.hier].some((mot) => lu.startsWith(`${mot} `));
  return relatif ? lu.charAt(0).toLowerCase() + lu.slice(1) : lu;
}
