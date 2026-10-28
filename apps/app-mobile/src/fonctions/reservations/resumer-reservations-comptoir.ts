import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { TEXTES_RESERVATIONS_PRO_PAR_LANGUE } from "~/contenus/textes-reservations-pro";
import { RESUMES_RESERVATIONS_PRO_PAR_LANGUE } from "~/contenus/textes-statut-reservation";

export function resumerReservationsComptoir(aRepondre: number, arrivees: readonly ReservationPro[], langue: Langue): string {
  const T = choisirTextes(RESUMES_RESERVATIONS_PRO_PAR_LANGUE, langue);
  const morceaux: string[] = [];
  if (aRepondre > 0) morceaux.push(T.aRepondre(aRepondre));
  if (arrivees.length > 0) morceaux.push(T.attendues(arrivees.length));
  return morceaux.length > 0 ? morceaux.join(" · ") : choisirTextes(TEXTES_RESERVATIONS_PRO_PAR_LANGUE, langue).entreeVide;
}
