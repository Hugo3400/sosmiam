import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { PAGE_Q, TEXTES_CONNEXION_QR } from "~/contenus/connexion-qr";

export const PAGE_Q_ANGLAIS: Traduction<typeof PAGE_Q> = {
  titre: "Open the SOS Miam app to log in",
  chapo: "Scan this QR code from the SOS Miam app, already logged in to your account: Profile → ⚙️ Settings → My account → Connect a device.",
  bouton: "Open the app",
  aide: "Don't have the app yet? It's coming soon to the stores. In the meantime, log in with your email on the screen that showed you this code.",
  introuvableTitre: "This QR code has sprung a leak",
  introuvableChapo: "It's incomplete or was copied wrong. Get a new one on the login screen, then scan it with the app.",
  titreMeta: "Log in with the app — SOS Miam",
  decouvrir: "Discover SOS Miam",
};

export const TEXTES_CONNEXION_QR_ANGLAIS: Traduction<typeof TEXTES_CONNEXION_QR> = {
  titre: "Log in with the app",
  intro: "Already logged in to SOS Miam on your phone? Scan a QR code with the app, confirm, and you're in – no password to type.",
  bouton: "Show the QR code",
  boutonRefaire: "Get a new code",
  unInstant: "Just a sec…",
  lienSansJs: "I've confirmed on my phone",
  prudence: "This code is for you alone: never send it to anyone, and never scan someone else's.",
  messages: {
    attente: "Scan this code with the SOS Miam app (Profile → ⚙️ Settings → My account → Connect a device).",
    scanne: "Confirm on your phone…",
    accepte: "Confirmed – come on in!",
    refuse: "Declined on the phone, so nothing was opened. You can get a new code.",
    expire: "Code expired – get a new one.",
    erreur: "A small hiccup on our side. Try again in a moment, or log in with your email.",
    trop: "Lots of codes requested at once – wait a few minutes before getting a new one.",
  },
};
