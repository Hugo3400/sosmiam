import { LIBELLES_MOTIF_REFUS_RESERVATION } from "@sos-miam/commun/contenus/motifs-refus";
import { ANNULATION_TARDIVE_MS, EXPIRATION_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { MotifRefusReservation, Reservation } from "@sos-miam/commun/types/reservation";

import { estReservationNonPointee } from "~/fonctions/reservations/est-reservation-non-pointee";
import { nommerPlaceReservation } from "~/fonctions/reservations/nommer-place-reservation";

const MINUTES_AVANT_EXPIRATION = Math.round(EXPIRATION_AVANT_CRENEAU_MS / 60_000);
const HEURES_ANNULATION_TARDIVE = Math.round(ANNULATION_TARDIVE_MS / 3_600_000);
const JE_SUIS_LA = "« Je suis là »";

const CONSOLATIONS: Readonly<Record<MotifRefusReservation, string>> = {
  complet: "Pas de panique, il reste plein d'autres créneaux (et plein d'autres pépites).",
  ferme: "Pas de panique, il reste plein d'autres créneaux (et plein d'autres pépites).",
  "groupe-trop-grand": "Appelle le lieu pour en parler de vive voix, ou tente une autre pépite.",
  autre: "Pas de panique, il reste plein d'autres pépites à découvrir.",
};

const citerMotif = (motif: MotifRefusReservation | null) => `« ${LIBELLES_MOTIF_REFUS_RESERVATION[motif ?? "autre"]} »`;

function expliquerAnnulation(reservation: Reservation): string {
  const place = nommerPlaceReservation(reservation.lieu.type);
  if (reservation.motifRefus) return `Le lieu a dû annuler : ${citerMotif(reservation.motifRefus)}. Désolé pour le contretemps, tu n'y es pour rien.`;
  if (reservation.reponduLe === null) return `Tu l'as retirée avant sa réponse : le lieu ne cherchera pas de ${place} pour rien. Pas de souci !`;
  if (reservation.tardive) return `Annulée moins de ${HEURES_ANNULATION_TARDIVE} h avant : le lieu l'a vue passer. Rien de grave si ça reste rare.`;
  return `Annulée à temps : ta ${place} est repartie pour un autre Miami. Merci pour le lieu !`;
}

function expliquerAcceptee(reservation: Reservation, maintenantMs: number): string | null {
  if (!estReservationNonPointee(reservation, maintenantMs)) return null;
  return reservation.presenceLe
    ? `Tu as touché ${JE_SUIS_LA}, mais le lieu n'a pas noté ton passage à temps : cette visite ne pourra pas compter. Rien n'est noté contre toi.`
    : "Le créneau est passé sans que le lieu note ton passage : cette visite ne pourra pas compter. Rien n'est noté contre toi, promis.";
}

function expliquerHonoree(reservation: Reservation, presencePossible: boolean): string {
  if (presencePossible) return `Le lieu a noté ton arrivée ! Touche ${JE_SUIS_LA} pour que ta visite compte.`;
  return reservation.presenceLe
    ? "Le lieu a noté ton passage, et ta visite compte dans « Mes visites ». Reviens quand tu veux !"
    : `Le lieu a noté ton passage, mais sans ${JE_SUIS_LA} sur place, la visite n'a pas pu compter. La prochaine fois, touche-le en arrivant !`;
}

export function expliquerReservation(reservation: Reservation, presencePossible: boolean, maintenantMs: number): string | null {
  switch (reservation.statut) {
    case "demandee":
      return `Le lieu te répond ici. Sans réponse ${MINUTES_AVANT_EXPIRATION} min avant le créneau, la demande s'endort toute seule.`;
    case "acceptee":
      return expliquerAcceptee(reservation, maintenantMs);
    case "refusee":
      return `Le lieu a répondu : ${citerMotif(reservation.motifRefus)}. ${CONSOLATIONS[reservation.motifRefus ?? "autre"]}`;
    case "annulee":
      return expliquerAnnulation(reservation);
    case "expiree":
      return "Le lieu n'a pas répondu à temps, alors la demande s'est endormie. Rien n'est compté contre toi.";
    case "honoree":
      return expliquerHonoree(reservation, presencePossible);
    case "absent":
      return `Le lieu a noté une absence. Un imprévu, ça arrive ! La prochaine fois, annule dans l'app : ta ${nommerPlaceReservation(reservation.lieu.type)} fera le bonheur d'un autre Miami.`;
  }
}
