import type { ErreurServiceCommunaute } from "../types/erreurs-service-communaute.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_SERVICES_COMMUNAUTE: Readonly<Record<ErreurServiceCommunaute, MessageService>> = {
  "public-reserve": {
    emoji: "🎟️",
    titre: "Ce public-là n'est pas le tien",
    texte: "Une sortie réservée s'organise de l'intérieur. Choisis un public dont tu fais partie, ou ouvre-la à tous les Miamis.",
  },
  "trop-de-sorties-miamis": {
    emoji: "🗓️",
    titre: "Ton agenda des Miamis déborde",
    texte: "5 sorties ouvertes à venir, c'est le maximum. Profite d'abord de celles-là !",
  },
  "genre-trop-tot": {
    emoji: "⏳",
    titre: "Encore un peu de patience",
    texte: "Ton genre se change une fois par mois, pour que les sorties réservées restent entre les bonnes personnes. Prochain changement possible le {date}.",
  },
  "presence-non-validee": {
    emoji: "📷",
    titre: "Scanne d'abord le QR du comptoir",
    texte: "Ta présence se valide avec le QR du comptoir du lieu. Demande-le à l'équipe, puis réessaie.",
  },
  "presence-fermee": {
    emoji: "🕰️",
    titre: "Pas le bon moment",
    texte: "La présence se valide sur place, de 1 h avant le début de la sortie à 4 h après.",
  },
  "invisible-ici": {
    emoji: "🫥",
    titre: "Tu es en mode invisible",
    texte: "Pour faire coucou, montre-toi d'abord dans « Qui est là ? ». Tu pourras te cacher à nouveau quand tu veux.",
  },
  "ville-requise": {
    emoji: "🏙️",
    titre: "Dis-nous ta ville",
    texte: "« Qui est là ? » montre les Miamis de ta ville. Ajoute-la dans Réglages, Mes infos, et c'est parti.",
  },
  "idee-proche": {
    emoji: "👯",
    titre: "Une idée jumelle existe déjà",
    texte: "Quelqu'un a eu presque la même. Vote plutôt pour elle : ta voix comptera plus !",
  },
  "idee-inconnue": {
    emoji: "💭",
    titre: "Idée envolée",
    texte: "Elle a été retirée, ou elle n'est pas encore relue par la Brigade.",
  },
  "idee-en-relecture": {
    emoji: "🔎",
    titre: "La Brigade la relit",
    texte: "On pourra voter et commenter dès qu'elle sera publiée. Ça ne devrait pas traîner !",
  },
};
