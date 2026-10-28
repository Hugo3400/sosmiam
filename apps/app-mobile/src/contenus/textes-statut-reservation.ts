import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import {
  RESUMES_RESERVATIONS_PRO_ANGLAIS,
  STATUTS_RESERVATION_ANGLAIS,
  STATUTS_RESERVATION_PRO_ANGLAIS,
} from "~/contenus/anglais/textes-statut-reservation";

export const STATUTS_RESERVATION = {
  creneauPasse: { texte: "🕰️ Créneau passé", lu: "Créneau passé, sans passage noté par le lieu" },
  surPlace: { texte: "📍 Tu es sur place", lu: "Réservé, et tu es sur place" },
  reserve: { texte: "✅ C'est réservé", lu: "C'est réservé" },
  demandee: { texte: "⏳ En attente du lieu", lu: "En attente de la réponse du lieu" },
  refusee: { texte: "Pas cette fois", lu: "Pas cette fois : le lieu a refusé" },
  annuleeParLieu: { texte: "Annulée par le lieu", lu: "Annulée par le lieu" },
  demandeAnnulee: { texte: "Demande annulée", lu: "Demande annulée par toi" },
  annuleeParToi: { texte: "Annulée par toi", lu: "Annulée par toi" },
  expiree: { texte: "😴 Demande endormie", lu: "Demande endormie, sans réponse à temps" },
  honoree: { texte: "🎉 Réservation honorée", lu: "Réservation honorée" },
  absent: { texte: "🪑 Absence notée", lu: "Absence notée par le lieu" },
} as const;

export const STATUTS_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof STATUTS_RESERVATION>> = { fr: STATUTS_RESERVATION, en: STATUTS_RESERVATION_ANGLAIS };

export const STATUTS_RESERVATION_PRO = {
  demandee: { texte: "⏳ À répondre", lu: "Demande à répondre" },
  surPlace: { texte: "📍 Sur place", lu: "Acceptée, et le client est sur place" },
  acceptee: { texte: "✅ Acceptée", lu: "Acceptée" },
  honoree: { texte: "🎉 Venu", lu: "Venu, passage noté" },
  absent: { texte: "🪑 Pas venu", lu: "Pas venu" },
  refusee: { texte: "Refusée", lu: "Refusée" },
  annulee: { texte: "Annulée", lu: "Annulée" },
  expiree: { texte: "😴 Sans réponse à temps", lu: "Demande endormie, sans réponse à temps" },
} as const;

export const STATUTS_RESERVATION_PRO_PAR_LANGUE: ParLangue<Traduction<typeof STATUTS_RESERVATION_PRO>> = {
  fr: STATUTS_RESERVATION_PRO,
  en: STATUTS_RESERVATION_PRO_ANGLAIS,
};

export const RESUMES_RESERVATIONS_PRO = {
  aRepondre: (n: number) => `${n} demande${n > 1 ? "s" : ""} à répondre`,
  attendues: (n: number) => `${n} table${n > 1 ? "s" : ""} attendue${n > 1 ? "s" : ""} aujourd'hui`,
  places: (n: number) => `${n}⍽place${n > 1 ? "s" : ""}`,
  demande: (nom: string, personnes: number, heure: string, suite: string) => `${nom} · ${personnes}⍽pers. · ${heure}${suite}`,
  aHeure: (heure: string) => `à ${heure}`,
  services: (n: number) => `${n} service${n > 1 ? "s" : ""}`,
} as const;

export const RESUMES_RESERVATIONS_PRO_PAR_LANGUE: ParLangue<Traduction<typeof RESUMES_RESERVATIONS_PRO>> = {
  fr: RESUMES_RESERVATIONS_PRO,
  en: RESUMES_RESERVATIONS_PRO_ANGLAIS,
};
