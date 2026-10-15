import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";

const accorder = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export function resumerReservationsComptoir(aRepondre: number, arrivees: readonly ReservationPro[]): string {
  const morceaux: string[] = [];
  if (aRepondre > 0) morceaux.push(`${accorder(aRepondre, "demande")} à répondre`);
  if (arrivees.length > 0) morceaux.push(`${accorder(arrivees.length, "table")} attendue${arrivees.length > 1 ? "s" : ""} aujourd'hui`);
  return morceaux.length > 0 ? morceaux.join(" · ") : TEXTES_RESERVATIONS_PRO.entreeVide;
}
