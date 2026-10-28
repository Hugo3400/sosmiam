import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { TEXTES_COMPTOIR_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { RESUMES_RESERVATIONS_PRO_PAR_LANGUE } from "~/contenus/textes-statut-reservation";
import { ecrireHeureParisLangue } from "~/fonctions/langue/ecrire-heure-paris-langue";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";

export function resumerDemandeReservation(reservation: ReservationPro, choisi: string, langue: Langue): { texte: string; lu: string } {
  const T = choisirTextes(TEXTES_COMPTOIR_RESERVATIONS_PAR_LANGUE, langue);
  const R = choisirTextes(RESUMES_RESERVATIONS_PRO_PAR_LANGUE, langue);
  const nom = nommerClientReservation(reservation);
  const rang = reservation.propositions.findIndex((p) => p.creneau === choisi);
  const proposition = reservation.propositions[rang];
  const heure = ecrireHeureParisLangue(choisi, langue);
  const details: string[] = [];
  if (reservation.propositions.length > 1) details.push(rang <= 0 ? T.premierChoix : T.planB);
  if (proposition?.jourFerme) details.push(T.jourFerme);
  else if (proposition && proposition.places !== null) {
    details.push(proposition.places < reservation.personnes ? T.completCourt : R.places(proposition.places));
  }
  const suite = details.length > 0 ? ` (${details.join(", ")})` : "";
  return {
    texte: R.demande(nom, reservation.personnes, heure, suite),
    lu: [nom, ecrireNombrePersonnesLangue(reservation.personnes, langue), R.aHeure(heure), ...details].join(", "),
  };
}
