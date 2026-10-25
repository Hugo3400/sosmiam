import type { ErreurImagesLieu } from "../types/erreurs-images-lieu.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_IMAGES_LIEU: Readonly<Record<ErreurImagesLieu, MessageService>> = {
  "image-lieu-invalide": {
    emoji: "🖼️",
    titre: "Cette image ne passe pas",
    texte: "La bannière part en JPEG de 1600 × 500, le logo en PNG carré de 512 × 512. Choisis une autre image : on la recadre toute seule.",
  },
  "image-lieu-trop-lourde": {
    emoji: "🎒",
    titre: "Ton image est un peu lourde",
    texte: "600 Ko au plus pour la bannière, 1 Mo pour le logo. Une image plus simple passera mieux.",
  },
};
