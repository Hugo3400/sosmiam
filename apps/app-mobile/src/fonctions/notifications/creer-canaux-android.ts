import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Les canaux de notifications de l'app sur Android, créés à chaque lancement (sans risque : Android ne fait alors que
 * mettre à jour le nom et la description). « Miam Safe » : les alertes urgentes (l'alerte du comptoir pour l'équipe du lieu,
 * « Prévenir un pote »), que le serveur envoie avec channel_id « miam-safe ». Importance maximale, son et vibration.
 * « Messages à la suite » : un message qui suit de moins de 30 s le précédent dans la même discussion (le serveur l'envoie
 * avec channel_id « messages-discrets ») ; il remplace la notification de la discussion sans bruit, comme sur iPhone.
 * Importance basse : ni son, ni vibration, ni bannière. Le premier message d'une rafale sonne, sur le canal par défaut.
 * Attention : une fois le canal créé sur un téléphone, l'app ne peut plus changer son importance ni son son (il faudrait un
 * nouvel identifiant). Miam Safe n'a pas de clé « sound » : sans elle, Android garde son son par défaut (« default » serait
 * cherché comme un fichier). Pas de « Ne pas déranger » contourné : c'est un accès spécial que seule la personne accorde. Ailleurs
 * qu'Android, rien à faire.
 */
export async function creerCanauxAndroid(): Promise<void> {
  if (Platform.OS !== "android") return;
  // Chacun le sien : un canal raté n'empêche pas l'autre (module natif absent ou refus du système : la notification arrive
  // quand même, sur le canal par défaut)
  await Notifications.setNotificationChannelAsync("miam-safe", {
    name: "Miam Safe",
    description: "Quand quelqu'un a besoin d'aide : l'alerte du comptoir pour ton équipe, ou un pote qui te prévient.",
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 500, 250, 500],
  }).catch(() => null);
  await Notifications.setNotificationChannelAsync("messages-discrets", {
    name: "Messages à la suite",
    description: "Quand un pote enchaîne les messages : le premier sonne, la suite arrive sans bruit.",
    importance: Notifications.AndroidImportance.LOW,
    // null : aucun son (sans la clé, Android mettrait son son par défaut)
    sound: null,
    enableVibrate: false,
  }).catch(() => null);
}
