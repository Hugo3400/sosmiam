import type { ErreurServiceReservations } from "../types/erreurs-reservations.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_RESERVATIONS: Readonly<Record<ErreurServiceReservations, MessageService>> = {
  "lieu-non-reservable": {
    emoji: "📵",
    titre: "{lieu} ne prend pas les réservations dans l'app",
    texte: "Tu peux passer directement, ou leur donner une rescousse.",
  },
  "creneau-invalide": {
    emoji: "🕰️",
    titre: "Ce créneau ne marche pas",
    texte: "Le lieu est fermé à cette heure-là, ou c'est trop proche. Choisis-en un autre.",
  },
  "creneau-complet": {
    emoji: "🏃",
    titre: "Raté de peu !",
    texte: "D'autres gourmands ont été plus rapides sur ces horaires. Choisis-en un autre : la liste vient d'être remise à jour.",
  },
  "personnes-invalides": {
    emoji: "👥",
    titre: "Combien vous êtes ?",
    texte: "Entre 1 et 12 personnes. Pour un plus grand groupe, appelle directement le lieu.",
  },
  "reservation-en-cours": {
    emoji: "📅",
    titre: "Tu as déjà une demande ici",
    texte: "Attends leur réponse, ou annule-la pour en faire une autre.",
  },
  "reservation-en-double": {
    emoji: "👯",
    titre: "C'est déjà demandé !",
    texte: "Tu viens de faire exactement la même demande ici. Elle t'attend dans Mes réservations : pas besoin de la doubler.",
  },
  "trop-de-reservations": {
    emoji: "🗓️",
    titre: "Ton agenda est déjà bien rempli",
    texte: "Tu as déjà 3 réservations à venir. Profite d'abord de celles-là, ou annules-en une, puis reviens en faire une autre.",
  },
  "hors-fenetre-presence": {
    emoji: "🕒",
    titre: "Pas encore l'heure",
    texte: "« Je suis là » s'ouvre une heure avant ton créneau, et jusqu'à 4 h après.",
  },
  "horaire-non-propose": {
    emoji: "🕰️",
    titre: "Cet horaire n'était pas proposé",
    texte: "Choisis l'un des horaires que la personne a proposés dans sa demande.",
  },
  "capacite-depassee": {
    emoji: "👥",
    titre: "Ça risque de déborder",
    texte: "Il ne reste pas assez de couverts à cet horaire. Accepte quand même si tu as la place, ou choisis un autre des horaires proposés.",
  },
  "jour-ferme": {
    emoji: "🛑",
    titre: "Ce jour-là est fermé aux résas",
    texte: "Tu as coupé les réservations ce jour-là. Il te reste de la place ? Accepte quand même : c'est toi le capitaine !",
  },
  "reglages-invalides": {
    emoji: "🛠️",
    titre: "Un réglage coince",
    texte: "Jette un œil au réglage signalé : deux services qui se chevauchent, une dernière arrivée avant la première, ou plus d'arrivées que de couverts.",
  },
};
