import type { ErreurServiceCommunaute } from "../../types/erreurs-service-communaute.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_SERVICES_COMMUNAUTE_ANGLAIS: Readonly<Record<ErreurServiceCommunaute, MessageService>> = {
  "public-reserve": {
    emoji: "🎟️",
    titre: "You're not part of that group",
    texte: "A restricted meetup is organised from the inside. Pick a group you belong to, or open it to all the Miamis.",
  },
  "trop-de-sorties-miamis": {
    emoji: "🗓️",
    titre: "Your meetup diary is overflowing",
    texte: "5 upcoming open meetups is the limit. Enjoy those first!",
  },
  "genre-trop-tot": {
    emoji: "⏳",
    titre: "Hang on a little longer",
    texte: "You can change your gender once a month, so restricted meetups stay with the right people. Your next change is possible on {date}.",
  },
  "presence-non-validee": {
    emoji: "📷",
    titre: "Scan the counter QR code first",
    texte: "Your attendance is confirmed with the venue's counter QR code. Ask the staff for it, then try again.",
  },
  "presence-fermee": {
    emoji: "🕰️",
    titre: "Not quite the right time",
    texte: "Attendance is confirmed on the spot, from 1 hour before the meetup starts until 4 hours after.",
  },
  "invisible-ici": {
    emoji: "🫥",
    titre: "You're in invisible mode",
    texte: "To wave, show yourself in “Who's around?” first. You can hide again whenever you like.",
  },
  "ville-requise": {
    emoji: "🏙️",
    titre: "Tell us your city",
    texte: "“Who's around?” shows the Miamis in your city. Add it in Profile › Edit my profile › My details, and off you go.",
  },
  "idee-proche": {
    emoji: "👯",
    titre: "A twin idea already exists",
    texte: "Someone had almost the same one. Vote for it instead – your vote will count for more!",
  },
  "idee-inconnue": {
    emoji: "💭",
    titre: "This idea has flown off",
    texte: "It's been withdrawn, or the Brigade hasn't reviewed it yet.",
  },
  "idee-en-relecture": {
    emoji: "🔎",
    titre: "The Brigade is reading it",
    texte: "You'll be able to vote and comment as soon as it's published. It shouldn't be long!",
  },
};
