import type { ErreurServiceReservations } from "../../types/erreurs-reservations.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_RESERVATIONS_ANGLAIS: Readonly<Record<ErreurServiceReservations, MessageService>> = {
  "lieu-non-reservable": {
    emoji: "📵",
    titre: "{lieu} doesn't take bookings in the app",
    texte: "You can just drop in, or give them a rescue.",
  },
  "creneau-invalide": {
    emoji: "🕰️",
    titre: "That slot doesn't work",
    texte: "The place is closed at that time, or it's too soon. Pick another one.",
  },
  "creneau-complet": {
    emoji: "🏃",
    titre: "So close!",
    texte: "Other foodies were quicker on these times. Pick another one – the list has just been refreshed.",
  },
  "personnes-invalides": {
    emoji: "👥",
    titre: "How many of you are there?",
    texte: "Between 1 and 12 people. For a bigger group, call the place directly.",
  },
  "reservation-en-cours": {
    emoji: "📅",
    titre: "You've already got a request here",
    texte: "Wait for their reply, or cancel it to make another one.",
  },
  "reservation-en-double": {
    emoji: "👯",
    titre: "Already requested!",
    texte: "You've just made exactly the same request here. It's waiting for you in My bookings – no need to send it twice.",
  },
  "trop-de-reservations": {
    emoji: "🗓️",
    titre: "Your diary's already pretty full",
    texte: "You've already got 3 upcoming bookings. Enjoy those first, or cancel one, then come back to make another.",
  },
  "hors-fenetre-presence": {
    emoji: "🕒",
    titre: "Not time yet",
    texte: "“I'm here” opens an hour before your slot, and stays open until 4 hours after.",
  },
  "horaire-non-propose": {
    emoji: "🕰️",
    titre: "That time wasn't offered",
    texte: "Pick one of the times the person suggested in their request.",
  },
  "capacite-depassee": {
    emoji: "👥",
    titre: "It might get a bit full",
    texte: "There aren't enough covers left at that time. Accept anyway if you have room, or pick another of the suggested times.",
  },
  "jour-ferme": {
    emoji: "🛑",
    titre: "That day is closed to bookings",
    texte: "You turned off bookings for that day. Still got room? Accept anyway – you're the captain of this ship!",
  },
  "reglages-invalides": {
    emoji: "🛠️",
    titre: "A setting doesn't add up",
    texte: "Check the highlighted setting: two services that overlap, a last arrival before the first, or more arrivals than covers.",
  },
};
