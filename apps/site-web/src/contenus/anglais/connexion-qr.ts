import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { PAGE_Q } from "~/contenus/connexion-qr";

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
