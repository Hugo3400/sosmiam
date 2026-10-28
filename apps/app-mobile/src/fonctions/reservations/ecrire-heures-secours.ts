import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { DATES_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client-dates";

export function ecrireHeuresSecours(heures: readonly string[], langue: Langue): string {
  const lues = heures.map((heure) => {
    const [h, m] = heure.split(":").map(Number);
    return formaterHeureLangue(h, m, langue);
  });
  if (lues.length <= 1) return lues.join("");
  return choisirTextes(DATES_RESERVATION_PAR_LANGUE, langue).puis(lues.slice(0, -1).join(", "), lues[lues.length - 1]);
}
