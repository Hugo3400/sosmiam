import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { TEXTES_COMPTOIR_RESERVATIONS as T } from "~/contenus/textes-comptoir-reservations";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";

export function resumerDemandeReservation(reservation: ReservationPro, choisi: string): { texte: string; lu: string } {
  const nom = nommerClientReservation(reservation);
  const rang = reservation.propositions.findIndex((p) => p.creneau === choisi);
  const proposition = reservation.propositions[rang];
  const heure = ecrireHeureParis(choisi);
  const details: string[] = [];
  if (reservation.propositions.length > 1) details.push(rang <= 0 ? T.premierChoix : T.planB);
  if (proposition?.jourFerme) details.push(T.jourFerme);
  else if (proposition && proposition.places !== null) {
    details.push(proposition.places < reservation.personnes ? T.completCourt : `${proposition.places} place${proposition.places > 1 ? "s" : ""}`);
  }
  const suite = details.length > 0 ? ` (${details.join(", ")})` : "";
  return {
    texte: `${nom} · ${reservation.personnes} pers. · ${heure}${suite}`,
    lu: [nom, ecrireNombrePersonnes(reservation.personnes), `à ${heure}`, ...details].join(", "),
  };
}
