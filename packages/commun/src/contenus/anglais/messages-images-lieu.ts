import type { ErreurImagesLieu } from "../../types/erreurs-images-lieu.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_IMAGES_LIEU_ANGLAIS: Readonly<Record<ErreurImagesLieu, MessageService>> = {
  "image-lieu-invalide": {
    emoji: "🖼️",
    titre: "This image won't go through",
    texte: "The banner goes up as a 1600 × 500 JPEG, the logo as a square 512 × 512 PNG. Pick another image – we'll crop it for you.",
  },
  "image-lieu-trop-lourde": {
    emoji: "🎒",
    titre: "Your image is a bit heavy",
    texte: "600 KB max for the banner, 1 MB for the logo. A simpler image will go through more easily.",
  },
};
