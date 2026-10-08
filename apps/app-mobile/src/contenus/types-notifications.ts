import type { TypeNotification } from "~/stockage/reglages-notifications";

/** Une sorte de notification, telle qu'on la montre dans les réglages. */
export type ChoixTypeNotification = {
  type: TypeNotification;
  emoji: string;
  titre: string;
  /** Petite phrase sous le titre : ce que dira la notification */
  detail: string;
  /** Section des réglages : « Ce qui t'intéresse » (lieux) ou « Tes abonnements » */
  groupe: "lieux" | "abonnements";
};

/** Les sortes de notifications qu'on peut choisir (toutes celles de TypeNotification) : les lieux, de la plus urgente à la plus tranquille, puis tes abonnements. */
export const typesNotifications: ChoixTypeNotification[] = [
  { type: "sos", emoji: "🛟", titre: "SOS près de toi", detail: "Un lieu a besoin de monde ce soir", groupe: "lieux" },
  { type: "calme", emoji: "😌", titre: "Salle calme, tables libres", detail: "Un lieu tranquille a de la place pour toi", groupe: "lieux" },
  { type: "offre", emoji: "🎁", titre: "Offres et happy hours", detail: "Une bonne affaire pas loin de toi", groupe: "lieux" },
  { type: "evenement", emoji: "🎉", titre: "Événements", detail: "Concert, quiz, soirée à thème\u00a0: de quoi bouger", groupe: "lieux" },
  { type: "nouveau", emoji: "✨", titre: "Nouveaux lieux", detail: "Un lieu vient d'arriver sur SOS Miam", groupe: "lieux" },
  { type: "abonne", emoji: "👋", titre: "Nouveaux abonnés", detail: "Quelqu'un commence à te suivre", groupe: "abonnements" },
  { type: "demande", emoji: "📨", titre: "Demandes d'abonnement", detail: "Quelqu'un veut te suivre", groupe: "abonnements" },
  { type: "publication-suivie", emoji: "🎬", titre: "Nouveautés des comptes suivis", detail: "Un lieu ou un créateur que tu suis publie", groupe: "abonnements" },
];
