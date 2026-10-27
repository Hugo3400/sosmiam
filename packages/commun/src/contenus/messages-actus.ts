import type { ErreurActus } from "../types/erreurs-actus.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_ACTUS: Readonly<Record<ErreurActus, MessageService>> = {
  "article-invalide": {
    emoji: "✏️",
    titre: "Quelques points à revoir",
    texte: "Ton article ne colle pas tout à fait aux règles de sa rubrique. Regarde les champs en rouge, puis renvoie-le.",
  },
  "article-introuvable": {
    emoji: "📰",
    titre: "Cet article n'est plus là",
    texte: "Il a peut-être été retiré, ou il attend encore la Brigade.",
  },
  "limite-actus-semaine": {
    emoji: "📰",
    titre: "Tes 3 articles de la semaine sont partis",
    texte: "La Brigade relit chaque article avec soin. Garde ton brouillon : tu pourras l'envoyer dès lundi.",
  },
  "photo-actus-invalide": {
    emoji: "🖼️",
    titre: "Cette photo ne passe pas",
    texte: "Il nous faut une photo JPEG d'au moins 320 pixels de côté. Essaie avec une autre.",
  },
  "photo-actus-trop-lourde": {
    emoji: "🎒",
    titre: "Ta photo est un peu lourde",
    texte: "5 Mo au plus par photo. Une photo plus légère passera mieux.",
  },
  "photo-actus-introuvable": {
    emoji: "🔎",
    titre: "Une photo s'est perdue en route",
    texte: "Une de tes photos n'est plus sur le serveur. Choisis-la de nouveau, puis renvoie ton article.",
  },
};
