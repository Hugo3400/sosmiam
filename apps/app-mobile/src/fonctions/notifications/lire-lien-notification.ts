import type { Notification } from "expo-notifications";

import { estLienPermis } from "~/fonctions/notifications/est-lien-permis";

const lireChampLien = (donnees: unknown): unknown =>
  typeof donnees === "object" && donnees !== null ? (donnees as Record<string, unknown>).lien : undefined;

/**
 * Le lien d'une notification (reçue ou touchée), s'il mène à un écran connu ; sinon null (on ouvre l'app, c'est tout).
 * Sur Android, il est dans content.data (les données FCM y sont copiées telles quelles). Sur iPhone, content.data d'une
 * notification venue du serveur est vide : expo n'y met que la clé « body » du format du service d'Expo, alors que notre API
 * pose le lien à la racine du message APNs. On le lit donc aussi dans trigger.payload, qui garde tout le message reçu.
 */
export function lireLienNotification(notification: Notification | null | undefined): string | null {
  if (!notification) return null;
  const { content, trigger } = notification.request;
  let lien = lireChampLien(content.data);
  // Seul le déclencheur « push » d'iPhone a un payload
  if (lien === undefined && trigger && "payload" in trigger) lien = lireChampLien(trigger.payload);
  return estLienPermis(lien) ? lien : null;
}
