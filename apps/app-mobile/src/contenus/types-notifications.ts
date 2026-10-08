import type { TypeNotification } from "~/stockage/reglages-notifications";

/** Une sorte de notification, telle qu'on la montre dans les réglages. */
export type ChoixTypeNotification = {
  type: TypeNotification;
  emoji: string;
  titre: string;
  /** Petite phrase sous le titre : ce que dira la notification */
  detail: string;
};

/** Les sortes de notifications qu'on peut choisir, de la plus urgente à la plus tranquille (toutes celles de TypeNotification). */
export const typesNotifications: ChoixTypeNotification[] = [
  { type: "sos", emoji: "🛟", titre: "SOS près de toi", detail: "Un lieu a besoin de monde ce soir" },
  { type: "calme", emoji: "😌", titre: "Salle calme, tables libres", detail: "Un lieu tranquille a de la place pour toi" },
  { type: "offre", emoji: "🎁", titre: "Offres et happy hours", detail: "Une bonne affaire pas loin de toi" },
  { type: "evenement", emoji: "🎉", titre: "Événements", detail: "Concert, quiz, soirée à thème\u00a0: de quoi bouger" },
  { type: "nouveau", emoji: "✨", titre: "Nouveaux lieux", detail: "Un lieu vient d'arriver sur SOS Miam" },
];
