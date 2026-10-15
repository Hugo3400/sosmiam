import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import type { EtiquetteReservation } from "~/fonctions/reservations/decrire-statut-reservation";

export function decrireStatutReservationPro(reservation: Pick<ReservationPro, "statut" | "presence">): EtiquetteReservation {
  switch (reservation.statut) {
    case "demandee":
      return { texte: "⏳ À répondre", lu: "Demande à répondre", ton: "attente" };
    case "acceptee":
      return reservation.presence
        ? { texte: "📍 Sur place", lu: "Acceptée, et le client est sur place", ton: "jaune" }
        : { texte: "✅ Acceptée", lu: "Acceptée", ton: "jaune" };
    case "honoree":
      return { texte: "🎉 Venu", lu: "Venu, passage noté", ton: "jaune" };
    case "absent":
      return { texte: "🪑 Pas venu", lu: "Pas venu", ton: "rose" };
    case "refusee":
      return { texte: "Refusée", lu: "Refusée", ton: "doux" };
    case "annulee":
      return { texte: "Annulée", lu: "Annulée", ton: "doux" };
    case "expiree":
      return { texte: "😴 Sans réponse à temps", lu: "Demande endormie, sans réponse à temps", ton: "doux" };
  }
}
