import type { Notification } from "expo-notifications";

const lireChampUrgent = (donnees: unknown): unknown =>
  typeof donnees === "object" && donnees !== null ? (donnees as Record<string, unknown>).urgent : undefined;

/**
 * Vrai si le serveur a marqué la notification urgente (urgent: "1", posé seulement sur les alertes Miam Safe). Comme le lien
 * (lire-lien-notification.ts) : sur Android dans content.data (les données FCM y sont copiées telles quelles), sur iPhone à
 * la racine du message APNs, gardé dans trigger.payload. Le lien seul ne suffit pas pour sonner app ouverte : /pro/comptoir
 * est aussi l'onglet d'accueil du mode pro, qu'une notification ordinaire peut ouvrir.
 */
export function estNotificationUrgente(notification: Notification | null | undefined): boolean {
  if (!notification) return false;
  const { content, trigger } = notification.request;
  let urgent = lireChampUrgent(content.data);
  // Seul le déclencheur « push » d'iPhone a un payload
  if (urgent === undefined && trigger && "payload" in trigger) urgent = lireChampUrgent(trigger.payload);
  return urgent === "1";
}
