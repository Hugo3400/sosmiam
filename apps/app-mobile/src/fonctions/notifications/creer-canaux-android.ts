import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { CANAUX_ANDROID_PAR_LANGUE } from "~/contenus/canaux-android";

/**
 * Les canaux de notifications de l'app sur Android, créés à chaque lancement et à chaque changement de langue (sans risque :
 * Android ne fait alors que mettre à jour le nom et la description, et ne baisse jamais une importance que la personne a
 * réglée). Le serveur nomme
 * toujours le canal (channel_id de expedier-push.ts) :
 * - « Miam Safe » (« miam-safe ») : les alertes urgentes (l'alerte du comptoir pour l'équipe du lieu, « Prévenir un pote »).
 *   Importance maximale, son et vibration.
 * - « Messages et sorties » (« messages ») : messages, groupes, sorties, bande. Importance haute : son, vibration et bannière.
 * - « Messages à la suite » (« messages-discrets ») : un message qui arrive moins de 30 s après le dernier de la même
 *   discussion qui a sonné ; il remplace la notification de la discussion sans bruit. Importance normale (et non basse :
 *   sinon Android le rangerait dans les « Silencieuses », parfois cachées sur l'écran verrouillé), mais ni son, ni
 *   vibration, ni bannière : il reste dans les notifications normales, comme sur iPhone.
 * - « Nouvelles de SOS Miam » (« notifications ») : bons plans, visites, nouvelles. Importance haute, comme les messages
 *   (choix de Hugo, 15 octobre 2026) : son, vibration et bannière. C'est aussi le canal par défaut du manifeste
 *   (« defaultChannel » d'app.json), utilisé par Firebase app fermée si le canal demandé n'existe pas ; app ouverte, expo
 *   prend alors son propre canal de repli « Miscellaneous ».
 * Attention : une fois un canal créé sur un téléphone, l'app ne peut plus monter son importance, ni changer son son ou sa
 * vibration (il faudrait un nouvel identifiant ; la baisser reste possible tant que la personne n'y a pas touché). Aucune
 * version Android n'est publiée le 15 octobre 2026 : ces réglages sont ceux qui partiront. Pas de clé « sound » pour un
 * canal qui sonne : sans elle, Android garde son son par défaut (« default » serait cherché comme un fichier). Pas de « Ne
 * pas déranger » contourné : c'est un accès spécial que seule la personne accorde. Chaque canal reste réglable par la
 * personne dans les réglages d'Android. Ailleurs qu'Android, rien à faire.
 */
export async function creerCanauxAndroid(langue: Langue): Promise<void> {
  if (Platform.OS !== "android") return;
  const T = choisirTextes(CANAUX_ANDROID_PAR_LANGUE, langue);
  // Chacun le sien : un canal raté n'empêche pas les autres (module natif absent ou refus du système : la notification
  // arrive quand même, sur le canal « notifications » ou sur un canal de repli « Miscellaneous »)
  await Notifications.setNotificationChannelAsync("miam-safe", {
    name: T.miamSafe.nom,
    description: T.miamSafe.description,
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 500, 250, 500],
  }).catch(() => null);
  await Notifications.setNotificationChannelAsync("messages", {
    name: T.messages.nom,
    description: T.messages.description,
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  }).catch(() => null);
  await Notifications.setNotificationChannelAsync("messages-discrets", {
    name: T.messagesDiscrets.nom,
    description: T.messagesDiscrets.description,
    importance: Notifications.AndroidImportance.DEFAULT,
    // null : aucun son (sans la clé, Android mettrait son son par défaut)
    sound: null,
    enableVibrate: false,
  }).catch(() => null);
  await Notifications.setNotificationChannelAsync("notifications", {
    name: T.notifications.nom,
    description: T.notifications.description,
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  }).catch(() => null);
}
