import type { ErreurCarriere } from "../../types/erreurs-carriere.ts";
import type { MessageService } from "../messages-services.ts";

export const MESSAGES_CARRIERE_ANGLAIS: Readonly<Record<ErreurCarriere, MessageService>> = {
  "offre-inconnue": {
    emoji: "🧭",
    titre: "Role not found",
    texte: "It's no longer online, or it never existed. Have a look at the other roles on the Join us page!",
  },
  "offre-fermee": {
    emoji: "🔒",
    titre: "Applications are closed",
    texte: "This role isn't taking applications any more. Thanks for thinking of us – another role on the Join us page might be waiting for you!",
  },
  "cv-trop-lourd": {
    emoji: "🎒",
    titre: "Your CV is a bit heavy",
    texte: "5 MB max. Export your PDF at “screen” quality, or make its images lighter, then try again.",
  },
  "cv-format": {
    emoji: "📄",
    titre: "Your CV needs to be a PDF",
    texte: "We only accept genuine PDF files, with no active content. Export your CV as a PDF from your software, then try again.",
  },
};
