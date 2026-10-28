import { ABSENT_APRES_CRENEAU_MS, VENU_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";

const MINUTE_MS = 60_000;
const AVANT_VENU = `${Math.ceil(VENU_AVANT_CRENEAU_MS / MINUTE_MS)} min`;
const APRES_ABSENT = `${Math.ceil(ABSENT_APRES_CRENEAU_MS / MINUTE_MS)} min`;

export const TEXTES_RESERVATIONS_PRO_ANGLAIS: Traduction<typeof TEXTES_RESERVATIONS_PRO> = {
  entreeTitre: "Bookings",
  entreeVide: "Your customers' requests land here",
  titre: "Bookings",
  sansLieuTitre: "No venue to manage yet",
  sansLieuTexte: "Bookings show up here as soon as your link to a venue is approved.",
  sousTitre: "Reply in one tap: the customer sees your answer straight away in the app. With no reply in time, the request quietly expires.",
  chargement: "Gathering the bookings…",
  reessayer: "Try again",
  indiceReessayer: "Reloads the venue's bookings",
  aRepondre: "Needs a reply",
  aujourdhui: "Today",
  aVenir: "Coming up",
  videTitre: "No bookings in sight",
  videTexte: "The calm before the rush: requests made in the app will land here, with the customer's note.",
  accepter: "Accept",
  refuser: "Decline",
  venu: "Arrived",
  absent: "No-show",
  petitMot: "Their note",
  code: "Arrival code",
  presenceNotee: "📍 Here now: their location has been checked.",
  attendreVenu: `“Arrived” lights up ${AVANT_VENU} before the slot.`,
  attendreAbsent: `Not here yet? “No-show” lights up ${APRES_ABSENT} after the slot. People run late.`,
  venuSansPresence: "The visit will count as soon as your customer taps “I'm here” on the spot.",
  refusTitre: "Decline {nom}'s request?",
  refusDetail: "The customer reads the reason you choose, never free text. They can try another slot.",
  refusConfirmer: "Decline request",
  refusRester: "Actually, no",
  annonceAcceptee: "✅ {nom}'s booking accepted · code {code}",
  annonceRefusee: "{nom}'s request declined",
  annonceVenu: "🎉 {nom}'s arrival noted",
  annonceAbsent: "{nom} marked as a no-show",
};
