import { LIBELLES_MOTIF_REFUS_RESERVATION } from "@sos-miam/commun/contenus/motifs-refus";
import { ANNULATION_TARDIVE_MS, EXPIRATION_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";

const MINUTES_AVANT_EXPIRATION = Math.round(EXPIRATION_AVANT_CRENEAU_MS / 60_000);
const HEURES_ANNULATION_TARDIVE = Math.round(ANNULATION_TARDIVE_MS / 3_600_000);

const citerMotif = (reservation: Reservation) => `« ${LIBELLES_MOTIF_REFUS_RESERVATION[reservation.motifRefus ?? "autre"]} »`;

function expliquerAnnulation(reservation: Reservation): string {
  if (reservation.motifRefus) return `Le lieu a dû annuler : ${citerMotif(reservation)}. Désolé pour le contretemps, tu n'y es pour rien.`;
  if (reservation.tardive) return `Annulée moins de ${HEURES_ANNULATION_TARDIVE} h avant : le lieu l'a vue passer. Rien de grave si ça reste rare.`;
  return "Annulée à temps : ta table est repartie pour un autre Miami. Merci pour le lieu !";
}

export function expliquerReservation(reservation: Reservation, presencePossible: boolean): string | null {
  switch (reservation.statut) {
    case "demandee":
      return `Le lieu te répond ici. Sans réponse ${MINUTES_AVANT_EXPIRATION} min avant le créneau, la demande s'endort toute seule.`;
    case "acceptee":
      return null;
    case "refusee":
      return `Le lieu a répondu : ${citerMotif(reservation)}. Pas de panique, il reste plein d'autres créneaux (et plein d'autres pépites).`;
    case "annulee":
      return expliquerAnnulation(reservation);
    case "expiree":
      return "Le lieu n'a pas répondu à temps, alors la demande s'est endormie. Rien n'est compté contre toi.";
    case "honoree":
      if (presencePossible) return "Le lieu t'a vu arriver ! Touche « Je\u00a0suis\u00a0là » pour que ta visite compte.";
      return reservation.presenceLe
        ? "Le lieu t'a vu passer et ta visite compte dans « Mes visites ». Reviens quand tu veux !"
        : "Le lieu t'a vu passer, mais sans « Je\u00a0suis\u00a0là » sur place, la visite n'a pas pu compter. La prochaine fois, touche-le en arrivant !";
    case "absent":
      return "Le lieu ne t'a pas vu passer. Un imprévu, ça arrive ! La prochaine fois, annule dans l'app : ta table fera le bonheur d'un autre Miami.";
  }
}
