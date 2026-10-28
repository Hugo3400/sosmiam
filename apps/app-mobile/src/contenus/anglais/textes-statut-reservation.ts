import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { RESUMES_RESERVATIONS_PRO, STATUTS_RESERVATION, STATUTS_RESERVATION_PRO } from "~/contenus/textes-statut-reservation";

export const STATUTS_RESERVATION_ANGLAIS: Traduction<typeof STATUTS_RESERVATION> = {
  creneauPasse: { texte: "🕰️ Slot passed", lu: "Slot passed, and the place didn't note your visit" },
  surPlace: { texte: "📍 You're here", lu: "Booked, and you're here" },
  reserve: { texte: "✅ You're booked", lu: "You're booked" },
  demandee: { texte: "⏳ Waiting for the place", lu: "Waiting for the place to reply" },
  refusee: { texte: "Not this time", lu: "Not this time: the place declined" },
  annuleeParLieu: { texte: "Cancelled by the place", lu: "Cancelled by the place" },
  demandeAnnulee: { texte: "Request cancelled", lu: "Request cancelled by you" },
  annuleeParToi: { texte: "Cancelled by you", lu: "Cancelled by you" },
  expiree: { texte: "😴 Request expired", lu: "Request expired, no reply in time" },
  honoree: { texte: "🎉 Booking honoured", lu: "Booking honoured" },
  absent: { texte: "🪑 No-show noted", lu: "No-show noted by the place" },
};

export const STATUTS_RESERVATION_PRO_ANGLAIS: Traduction<typeof STATUTS_RESERVATION_PRO> = {
  demandee: { texte: "⏳ Needs a reply", lu: "Request waiting for your reply" },
  surPlace: { texte: "📍 On site", lu: "Accepted, and the customer is on site" },
  acceptee: { texte: "✅ Accepted", lu: "Accepted" },
  honoree: { texte: "🎉 Arrived", lu: "Arrived, visit noted" },
  absent: { texte: "🪑 No-show", lu: "No-show" },
  refusee: { texte: "Declined", lu: "Declined" },
  annulee: { texte: "Cancelled", lu: "Cancelled" },
  expiree: { texte: "😴 No reply in time", lu: "Request expired, no reply in time" },
};

export const RESUMES_RESERVATIONS_PRO_ANGLAIS: Traduction<typeof RESUMES_RESERVATIONS_PRO> = {
  aRepondre: (n: number) => `${n} request${n === 1 ? "" : "s"} to answer`,
  attendues: (n: number) => `${n} table${n === 1 ? "" : "s"} expected today`,
  places: (n: number) => `${n} seat${n === 1 ? "" : "s"}`,
  demande: (nom: string, personnes: number, heure: string, suite: string) => `${nom} · for ${personnes} · ${heure}${suite}`,
  aHeure: (heure: string) => `at ${heure}`,
  services: (n: number) => `${n} service${n === 1 ? "" : "s"}`,
};
