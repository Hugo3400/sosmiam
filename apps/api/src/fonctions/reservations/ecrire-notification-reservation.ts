import { LIBELLES_MOTIF_REFUS_RESERVATION } from "../../../../../packages/commun/src/contenus/motifs-refus.ts";
import type { MessagePush } from "../../services/notifications/expedier-push.ts";
import type { ReponseReservation } from "../../services/reservations-regles.ts";
import { ecrireMomentReservation } from "./ecrire-moment-reservation.ts";

const LIEN = "/reservations";

export function ecrireNotificationReservation(r: ReponseReservation, maintenant: Date): MessagePush {
  const lieu = r.lieu.nom;
  const moment = ecrireMomentReservation(r.creneau, maintenant);
  const motif = `« ${LIBELLES_MOTIF_REFUS_RESERVATION[r.motif ?? "autre"]} »`;
  const place = r.lieu.type === "sortie" ? "ta place" : "ta table";
  switch (r.statut) {
    case "acceptee":
      return { titre: "C'est réservé ! 🎉", texte: `${lieu} t'attend ${moment}. Ton code d'arrivée t'attend dans Mes réservations.`, lien: LIEN };
    case "refusee":
      return { titre: "Pas cette fois 😕", texte: `${lieu} a répondu pour ${moment} : ${motif}. Plein d'autres créneaux (et d'autres pépites) t'attendent !`, lien: LIEN };
    case "annulee":
      return { titre: "Changement de programme 😕", texte: `${lieu} a dû annuler ${place} pour ${moment} : ${motif}. Désolé pour le contretemps, tu n'y es pour rien.`, lien: LIEN };
    case "expiree":
      return { titre: "Pas de réponse à temps 😴", texte: `${lieu} n'a pas pu répondre à temps pour ${moment}. Ta demande s'est endormie, pas ton appétit : tente un autre créneau !`, lien: LIEN };
  }
}
