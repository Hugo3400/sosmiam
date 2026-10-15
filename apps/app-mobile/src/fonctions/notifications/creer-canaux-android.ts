import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Les canaux de notifications de l'app sur Android, créés à chaque lancement (sans risque : Android ne fait alors que
 * mettre à jour le nom et la description, et ne baisse jamais une importance que la personne a réglée). Le serveur nomme
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
export async function creerCanauxAndroid(): Promise<void> {
  if (Platform.OS !== "android") return;
  // Chacun le sien : un canal raté n'empêche pas les autres (module natif absent ou refus du système : la notification
  // arrive quand même, sur le canal « notifications » ou sur un canal de repli « Miscellaneous »)
  await Notifications.setNotificationChannelAsync("miam-safe", {
    name: "Miam Safe",
    description: "Quand quelqu'un a besoin d'aide : l'alerte du comptoir pour ton équipe, ou un pote qui te prévient.",
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 500, 250, 500],
  }).catch(() => null);
  await Notifications.setNotificationChannelAsync("messages", {
    name: "Messages et sorties",
    description: "Tes potes t'écrivent, t'invitent à une sortie ou rejoignent ta bande : ça sonne, ça vibre, tu ne rates rien.",
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  }).catch(() => null);
  await Notifications.setNotificationChannelAsync("messages-discrets", {
    name: "Messages à la suite",
    description: "Quand un pote enchaîne les messages : le premier sonne, la suite arrive sans bruit.",
    importance: Notifications.AndroidImportance.DEFAULT,
    // null : aucun son (sans la clé, Android mettrait son son par défaut)
    sound: null,
    enableVibrate: false,
  }).catch(() => null);
  await Notifications.setNotificationChannelAsync("notifications", {
    name: "Nouvelles de SOS Miam",
    description: "Les SOS et bons plans près de chez toi, tes visites validées et des nouvelles du Capitaine Bouiboui.",
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  }).catch(() => null);
}
