import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { NomServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

import { DATES_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client-dates";
import { MOMENTS_CRENEAUX, MOMENTS_CRENEAUX_PAR_LANGUE } from "~/contenus/textes-reserver-table";

export function ecrireNomService(nom: NomServiceReservation, langue: Langue): { emoji: string; titre: string } {
  const { emoji } = MOMENTS_CRENEAUX[nom.moment];
  const { libelle } = choisirTextes(MOMENTS_CRENEAUX_PAR_LANGUE, langue)[nom.moment];
  if (nom.rang === null) return { emoji, titre: libelle };
  return { emoji, titre: choisirTextes(DATES_RESERVATION_PAR_LANGUE, langue).service(libelle, nom.rang) };
}
