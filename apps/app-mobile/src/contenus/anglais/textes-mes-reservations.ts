import { RESERVATIONS_A_VENIR_MAX } from "@sos-miam/commun/regles/reservations";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type {
  ENTREE_MES_RESERVATIONS,
  SANS_COMPTE_RESERVATIONS,
  SECTION_RESERVATIONS_SCAN,
  TEXTES_ECHEC_GESTE_RESERVATION,
  TEXTES_MES_RESERVATIONS,
} from "~/contenus/textes-mes-reservations";

export const TEXTES_MES_RESERVATIONS_ANGLAIS: Traduction<typeof TEXTES_MES_RESERVATIONS> = {
  titre: "My bookings",
  sousTitre: "Your requests and the places' replies. It's free, no card needed, and if you can't make it any more, you cancel in one tap.",
  noteMaximum: `${RESERVATIONS_A_VENIR_MAX} upcoming bookings is the max – that leaves room for the other Miamis. As soon as one's over or cancelled, you can make another.`,
  chargement: "Gathering your bookings…",
  reessayer: "Try again",
  indiceReessayer: "Reloads your bookings",
  lectureHorsLigne: "We're keeping your bookings warm for you: they'll land as soon as you're back online.",
  positionEnCours: "Checking where you are…",
  envoiPresence: "Letting the place know…",
  presenceNotee: "Noted, you're here. Give your code to the staff.",
};

export const TEXTES_ECHEC_GESTE_RESERVATION_ANGLAIS: Traduction<typeof TEXTES_ECHEC_GESTE_RESERVATION> = {
  "transition-interdite": "It changed in the meantime (a reply from the place, maybe): we've just refreshed everything.",
  "delai-depasse": "The slot has already passed – there's nothing left to cancel.",
  introuvable: "This booking doesn't exist on your side any more: we've just refreshed everything.",
  "hors-ligne": "Nothing was sent. Check your connection, then try again – nothing's lost.",
};

export const ENTREE_MES_RESERVATIONS_ANGLAIS: Traduction<typeof ENTREE_MES_RESERVATIONS> = {
  titre: "My bookings",
  indice: "Opens your bookings",
  vide: "No tables on the horizon yet – book from a gem's page",
  rienDePrevu: "Nothing planned for now – fancy a gem?",
  pasEncoreLues: "Your requests and the places' replies",
};

export const SECTION_RESERVATIONS_SCAN_ANGLAIS: Traduction<typeof SECTION_RESERVATIONS_SCAN> = {
  titre: "My bookings",
  vide: "No table booked for now. On the day, this is where you tap “I'm here” when you arrive.",
  indiceLigne: "Opens your bookings",
  pasEncoreLues: "Your bookings haven't come through yet – they'll show up here as soon as the signal's back. Tap “See all” to reload them.",
};

export const SANS_COMPTE_RESERVATIONS_ANGLAIS: Traduction<typeof SANS_COMPTE_RESERVATIONS> = {
  emoji: "🔑",
  titre: "Booking needs an account",
  texte: "Create your account – it's free and takes a minute. You'll book in two taps, and places reply to you right here in the app.",
  bouton: "Create my account",
  indice: "Opens account creation",
};
