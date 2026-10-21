import type { ErreurSecurite } from "../types/erreurs-securite.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_SECURITE: Readonly<Record<ErreurSecurite, MessageService>> = {
  "image-trop-lourde": {
    emoji: "🎒",
    titre: "Une capture est un peu lourde",
    texte: "5 Mo au plus par image. Recadre-la ou enregistre-la en JPEG, puis réessaie.",
  },
  "image-format": {
    emoji: "🖼️",
    titre: "Seulement des images PNG ou JPEG",
    texte: "Les autres fichiers ne passent pas. Pour une vidéo ou un script, mets plutôt un lien dans ton signalement.",
  },
  "trop-d-images": {
    emoji: "🧺",
    titre: "3 captures au plus",
    texte: "Garde les 3 qui montrent le mieux la faille : le reste, tu peux le décrire ou le mettre derrière un lien.",
  },
};
