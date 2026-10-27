import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_INSCRIPTION_NEWSLETTER } from "~/contenus/inscription-newsletter";

export const TEXTES_INSCRIPTION_NEWSLETTER_ANGLAIS: Traduction<typeof TEXTES_INSCRIPTION_NEWSLETTER> = {
  titre: "Ready to rescue your first table?",
  intro: "The app's still in the kitchen – leave your email and we'll let you know as soon as it arrives near you.",
  email: { libelle: "Your email", exemple: "your@email.com" },
  ville: { libelle: "Your city or region", facultatif: "(optional)" },
  telephone: {
    question: "Your phone (so we know which store to release the app on):",
    iphone: "iPhone (Apple)",
    android: "Android (Samsung, Google Pixel or other)",
  },
  beta: {
    libelle: "I want to test the app before it's out (beta)",
    aide: "Pick your phone just above too. On Android, your email needs to be the one on your Google account (often your Gmail); on iPhone, ideally the one on your Apple Account.",
  },
  ambassadeur: "I want to become an ambassador (18+)",
  envoi: "Sending…",
  bouton: "Keep me posted",
  mentions: {
    avant:
      "First, an email to check the address really is yours – no click, no newsletter. Then we'll let you know when we launch, and after that we'll send you the newsletter (one email is all it takes to unsubscribe). If you tick the beta, we'll pass your address to Google or Apple so they can invite you to test the app; if you tick ambassador, we'll email you an invitation to create your account on ambassadeur.sosmiam.fr. We never sell your data (",
    lien: "privacy",
    nouvelOnglet: ", opens in a new tab",
    apres: ").",
  },
  erreurs: {
    "email-invalide": "Oops, that email address doesn't look right.",
    "telephone-requis": "For the beta, tell us whether you've got an iPhone or an Android.",
    "trop-de-demandes": "Easy does it! Too many tries in a row – try again in a few minutes.",
    erreur: "Oops, your sign-up didn't go through. Try again in a moment, or drop us a line at bonjour@sosmiam.fr.",
  },
  confirmation: (ou: string) =>
    `Nearly there! A confirmation link is waiting in your inbox (have a look in your spam too): one click, and we'll let you know as soon as SOS Miam arrives ${ou}. 🛟`,
  ou: (lieu: { nom: string; ou: string } | null) => (lieu ? `in ${lieu.nom}` : "near you"),
  suiteBeta: "We'll invite you to test the beta as soon as it's ready. 🧪",
  suiteAmbassadeur: "We'll also email you an invitation to the ambassador area (18+). 🎖️",
};
