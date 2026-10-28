import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { TypeLieu } from "@sos-miam/commun/types/lieu";

import { ARRIVEE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";

export function souhaiterBonMoment(type: TypeLieu, langue: Langue): string {
  const T = choisirTextes(ARRIVEE_RESERVATION_PAR_LANGUE, langue);
  return type === "resto" || type === "patisserie" ? T.souhaitRepas : T.souhaitSortie;
}
