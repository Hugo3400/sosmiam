import type { ErreurCarriere } from "../types/erreurs-carriere.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_CARRIERE: Readonly<Record<ErreurCarriere, MessageService>> = {
  "offre-inconnue": {
    emoji: "🧭",
    titre: "Offre introuvable",
    texte: "Elle n'est plus en ligne, ou elle n'a jamais existé. Jette un œil aux autres offres de la page Carrière !",
  },
  "offre-fermee": {
    emoji: "🔒",
    titre: "Les candidatures sont closes",
    texte: "Cette offre ne prend plus de candidatures. Merci d'avoir pensé à nous : une autre offre de la page Carrière t'attend peut-être !",
  },
  "cv-trop-lourd": {
    emoji: "🎒",
    titre: "Ton CV est un peu lourd",
    texte: "5 Mo au plus. Exporte ton PDF en qualité « écran », ou allège ses images, puis réessaie.",
  },
  "cv-format": {
    emoji: "📄",
    titre: "Ton CV doit être un PDF",
    texte: "On n'accepte que les vrais fichiers PDF, sans contenu actif. Exporte ton CV en PDF depuis ton logiciel, puis réessaie.",
  },
};
