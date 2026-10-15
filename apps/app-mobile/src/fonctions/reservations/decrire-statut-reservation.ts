import type { Reservation } from "@sos-miam/commun/types/reservation";

export type TonEtiquetteReservation = "jaune" | "attente" | "rose" | "doux";

export type EtiquetteReservation = { texte: string; lu: string; ton: TonEtiquetteReservation };

export function decrireStatutReservation(reservation: Reservation): EtiquetteReservation {
  switch (reservation.statut) {
    case "demandee":
      return { texte: "⏳ En attente du lieu", lu: "En attente de la réponse du lieu", ton: "attente" };
    case "acceptee":
      return reservation.presenceLe
        ? { texte: "📍 Tu es sur place", lu: "Réservé, et tu es sur place", ton: "jaune" }
        : { texte: "✅ C'est réservé", lu: "C'est réservé", ton: "jaune" };
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
      return { texte: "🎉 Table honorée", lu: "Table honorée", ton: "jaune" };
    case "absent":
      return { texte: "🪑 Absence notée", lu: "Absence notée par le lieu", ton: "rose" };
  }
}
