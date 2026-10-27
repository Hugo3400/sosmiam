import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_ESPACE_PRO } from "~/contenus/espace-pro";

export const TEXTES_ESPACE_PRO_ANGLAIS: Traduction<typeof TEXTES_ESPACE_PRO> = {
  meta: {
    titre: "Pro area",
    description: "SOS Miam pro: keep your listing up to date, share your good-to-know info, see customer suggestions, and manage your staff and your table card. Free, with no subscription or commission.",
  },
  boutons: {
    tableau: "Go to my dashboard",
    creerCompte: "Create my account",
    connexion: "Log in",
    pasSurSosMiam: "My venue isn't on SOS Miam",
  },
  badge: "For restaurants, bars and patisseries (and things to do too)",
  titre: "Your venue, your listing, your foodies.",
  chapo: "The SOS Miam pro area is where you keep your listing up to date, see what customers suggest and invite your staff. All without paying a penny.",
  inscrireEn3Minutes: " – list it in 3 minutes.",
  gratuit: {
    pourToujours: "For good",
    titre: "It's free",
    sans: ["No subscription", "No commitment", "No commission"],
    pub: "SOS Miam is funded by ads – always labelled, and they never change the rankings.",
  },
  aujourdhui: "What you can do from today",
  bientot: {
    titre: "Coming soon, with the app",
    texte: "These arrive with the SOS Miam app. We'll let you know as soon as they're ready.",
    pastille: "Coming soon",
  },
  commentCaMarche: "How does it work?",
  atouts: [
    { titre: "Your listing, up to date", texte: "Opening hours, description, contact details: change them and they're live straight away. And your venue gets the Verified ✓ badge." },
    { titre: "Your good-to-know info", texte: "Pets, terrace, wheelchair access, Wi-Fi, payments, booking: foodies know what to expect." },
    { titre: "Customer suggestions", texte: "A customer spots a mistake on your listing? You see what they suggest, and what the SOS Miam team did with it." },
    { titre: "Your staff", texte: "Invite your colleagues: they can see the listing without being able to turn everything upside down." },
    { titre: "Your table card", texte: "A QR code to your listing, to print and put on the tables or the counter." },
  ],
  avecLApp: [
    { titre: "The counter QR code", texte: "Your customers get their visit confirmed with one scan." },
    { titre: "Tonight's SOS", texte: "An empty table tonight? Let local foodies know." },
    { titre: "Your stats", texte: "Listing views, rescues, confirmed visits." },
    { titre: "Your reviews", texte: "Read your verified reviews and reply to them." },
  ],
  etapes: [
    "Create your SOS Miam account (2 minutes).",
    "Find your venue and tell us it's yours.",
    "The SOS Miam team checks, and your listing is yours.",
  ],
};
