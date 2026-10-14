// Le texte de chaque erreur de la connexion par QR code, identique dans l'app et ailleurs. Repris par MESSAGES_SERVICE
// (messages-services.ts). Pas d'emoji dans titre ni texte : l'emoji est à part, caché aux lecteurs d'écran.

import type { ErreurConnexionQr } from "../types/erreurs-connexion-qr.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_CONNEXION_QR: Readonly<Record<ErreurConnexionQr, MessageService>> = {
  "connexion-qr-inconnue": {
    emoji: "🔍",
    titre: "Ce QR ne nous dit rien",
    texte: "Ce n'est pas un QR de connexion SOS Miam, ou il n'existe plus. Demandes-en un nouveau sur l'écran de connexion.",
  },
  "connexion-qr-expiree": {
    emoji: "⏳",
    titre: "Ce QR a expiré",
    texte: "Un QR de connexion ne vit que 2 minutes et ne sert qu'une fois. Fais-en afficher un nouveau, puis rescanne-le.",
  },
  "connexion-qr-deja-scannee": {
    emoji: "🚧",
    titre: "Déjà scanné par quelqu'un d'autre",
    texte: "Un autre compte a scanné ce QR avant toi. Si c'était bien ton écran, fais-en afficher un nouveau.",
  },
  "deja-repondu": {
    emoji: "✅",
    titre: "C'est déjà répondu",
    texte: "Tu as déjà accepté ou refusé cette connexion. Pour recommencer, fais afficher un nouveau QR.",
  },
  "session-app-requise": {
    emoji: "📱",
    titre: "Ça se valide dans l'app",
    texte: "Seule l'app SOS Miam, connectée à ton compte, peut valider une connexion par QR.",
  },
};
