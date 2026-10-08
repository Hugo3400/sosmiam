// Notifications de la démo, en attendant les comptes : toujours les mêmes, pour des tests qu'on peut rejouer.
import type { NotificationSuivi } from "@sos-miam/commun/types/suivis";

/** Démo « a posté » : un lieu ou un créateur que tu viens de suivre « publie » au bout de ce délai (millisecondes) */
export const DELAI_PUBLICATION_EXEMPLE = 6000;

const HEURE = 3_600_000;

/**
 * Notifications de départ. Adulte : Sofia te suit depuis 3 h (elle est déjà dans tes abonnés d'exemple).
 * Entre 15 et 17 ans : rien (la demande de Jade est dans les suivis, pas dans les notifications).
 */
export function creerNotificationsDemo(moiMineur: boolean, maintenant: Date): NotificationSuivi[] {
  if (moiMineur) return [];
  return [{ id: "notification-exemple-sofia", date: new Date(maintenant.getTime() - 3 * HEURE).toISOString(), type: "nouvel-abonne", cle: "personne:sofia", enRetour: false }];
}
