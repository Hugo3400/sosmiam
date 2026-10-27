import type { ErreurActus } from "../../types/erreurs-actus.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_ACTUS_ANGLAIS: Readonly<Record<ErreurActus, MessageService>> = {
  "article-invalide": {
    emoji: "✏️",
    titre: "A few things to fix",
    texte: "Your story doesn't quite fit the rules of its section. Check the fields in red, then send it again.",
  },
  "article-introuvable": {
    emoji: "📰",
    titre: "This story isn't here any more",
    texte: "It may have been taken down, or it's still waiting for the Brigade.",
  },
  "limite-actus-semaine": {
    emoji: "📰",
    titre: "Your 3 stories for the week are in",
    texte: "The Brigade checks every story carefully. Keep your draft – you can send it from Monday.",
  },
  "photo-actus-invalide": {
    emoji: "🖼️",
    titre: "This photo won't go through",
    texte: "We need a JPEG photo at least 320 pixels on each side. Try another one.",
  },
  "photo-actus-trop-lourde": {
    emoji: "🎒",
    titre: "Your photo is a bit heavy",
    texte: "5 MB max per photo. A lighter photo will go through more easily.",
  },
  "photo-actus-introuvable": {
    emoji: "🔎",
    titre: "A photo got lost on the way",
    texte: "One of your photos is no longer on the server. Choose it again, then resend your story.",
  },
};
