import type { Notification } from "expo-notifications";

/** Les écrans qu'une notification peut ouvrir (le « lien » posé par le serveur) : jamais une adresse inventée ou externe */
const LIENS_PERMIS = [
  /^\/$/, /^\/explorer$/, /^\/potes$/, /^\/profil$/, /^\/notifications$/, /^\/lieu\/\d{1,9}$/,
  // Miam Safe : l'alerte silencieuse au comptoir (équipe du lieu) et « Prévenir un pote » (le partage de position)
  /^\/pro\/comptoir$/, /^\/miam-safe\/partage\/\d{1,9}$/,
  // Partie sociale (C.5) : un message (privé ou groupe), la liste des messages (invitation à un groupe), une sortie, un profil
  // (identifiant public : 10 caractères, jamais l'id d'un compte)
  /^\/potes\/messages$/, /^\/potes\/discussion\/\d{1,12}$/, /^\/potes\/sortie\/\d{1,12}$/, /^\/potes\/profil\/[a-z2-9]{10}$/,
];

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
  if (lien === undefined && trigger && trigger.type === "push" && "payload" in trigger) lien = lireChampLien(trigger.payload);
  return typeof lien === "string" && LIENS_PERMIS.some((forme) => forme.test(lien)) ? lien : null;
}
