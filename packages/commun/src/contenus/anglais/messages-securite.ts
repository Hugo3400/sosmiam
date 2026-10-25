import type { ErreurSecurite } from "../../types/erreurs-securite.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_SECURITE_ANGLAIS: Readonly<Record<ErreurSecurite, MessageService>> = {
  "image-trop-lourde": {
    emoji: "🎒",
    titre: "One screenshot is a bit heavy",
    texte: "5 MB max per image. Crop it or save it as a JPEG, then try again.",
  },
  "image-format": {
    emoji: "🖼️",
    titre: "PNG or JPEG images only",
    texte: "Other files won't go through. For a video or a script, add a link to your report instead.",
  },
  "trop-d-images": {
    emoji: "🧺",
    titre: "3 screenshots max",
    texte: "Keep the 3 that show the flaw best – you can describe the rest or put it behind a link.",
  },
};
