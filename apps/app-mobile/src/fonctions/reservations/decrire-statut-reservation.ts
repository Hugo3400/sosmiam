import type { Reservation } from "@sos-miam/commun/types/reservation";

import { estReservationNonPointee } from "~/fonctions/reservations/est-reservation-non-pointee";

export type TonEtiquetteReservation = "jaune" | "attente" | "rose" | "doux";

export type EtiquetteReservation = { texte: string; lu: string; ton: TonEtiquetteReservation };

function decrireAcceptee(reservation: Reservation, maintenantMs: number): EtiquetteReservation {
  if (estReservationNonPointee(reservation, maintenantMs)) return { texte: "🕰️ Créneau passé", lu: "Créneau passé, sans passage noté par le lieu", ton: "doux" };
  return reservation.presenceLe
    ? { texte: "📍 Tu es sur place", lu: "Réservé, et tu es sur place", ton: "jaune" }
    : { texte: "✅ C'est réservé", lu: "C'est réservé", ton: "jaune" };
}

export function decrireStatutReservation(reservation: Reservation, maintenantMs: number): EtiquetteReservation {
  switch (reservation.statut) {
    case "demandee":
      return { texte: "⏳ En attente du lieu", lu: "En attente de la réponse du lieu", ton: "attente" };
    case "acceptee":
      return decrireAcceptee(reservation, maintenantMs);
    case "refusee":
      return { texte: "Pas cette fois", lu: "Pas cette fois : le lieu a refusé", ton: "rose" };
    case "annulee":
      if (reservation.motifRefus) return { texte: "Annulée par le lieu", lu: "Annulée par le lieu", ton: "rose" };
      return reservation.reponduLe === null
        ? { texte: "Demande annulée", lu: "Demande annulée par toi", ton: "doux" }
        : { texte: "Annulée par toi", lu: "Annulée par toi", ton: "doux" };
    case "expiree":
      return { texte: "😴 Demande endormie", lu: "Demande endormie, sans réponse à temps", ton: "doux" };
    case "honoree":
      return { texte: "🎉 Réservation honorée", lu: "Réservation honorée", ton: "jaune" };
    case "absent":
      return { texte: "🪑 Absence notée", lu: "Absence notée par le lieu", ton: "rose" };
  }
}
