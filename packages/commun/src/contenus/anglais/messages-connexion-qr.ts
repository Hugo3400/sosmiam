import type { ErreurConnexionQr } from "../../types/erreurs-connexion-qr.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_CONNEXION_QR_ANGLAIS: Readonly<Record<ErreurConnexionQr, MessageService>> = {
  "connexion-qr-inconnue": {
    emoji: "🔍",
    titre: "This QR code doesn't ring a bell",
    texte: "It isn't an SOS Miam login QR code, or it no longer exists. Ask for a new one on the login screen.",
  },
  "connexion-qr-expiree": {
    emoji: "⏳",
    titre: "This QR code has expired",
    texte: "A login QR code only lasts 2 minutes and works once. Bring up a new one, then scan it again.",
  },
  "connexion-qr-deja-scannee": {
    emoji: "🚧",
    titre: "Already scanned by someone else",
    texte: "Another account scanned this QR code before you. If it really was your screen, bring up a new one.",
  },
  "deja-repondu": {
    emoji: "✅",
    titre: "You've already answered",
    texte: "You've already accepted or declined this login. To start again, bring up a new QR code.",
  },
  "session-app-requise": {
    emoji: "📱",
    titre: "This is done in the app",
    texte: "Only the SOS Miam app, logged in to your account, can approve a QR code login.",
  },
};
