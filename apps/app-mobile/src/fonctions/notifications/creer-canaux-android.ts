import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Les canaux de notifications de l'app sur Android, créés à chaque lancement (sans risque : Android ne fait alors que
 * mettre à jour le nom et la description). « Miam Safe » : les alertes urgentes (l'alerte du comptoir pour l'équipe du lieu,
 * « Prévenir un pote »), que le serveur envoie avec channel_id « miam-safe ». Importance maximale, son et vibration.
 * Attention : une fois le canal créé sur un téléphone, l'app ne peut plus changer son importance ni son son (il faudrait un
 * nouvel identifiant). Pas de clé « sound » : sans elle, Android garde son son par défaut (« default » serait cherché comme
 * un fichier). Pas de « Ne pas déranger » contourné : c'est un accès spécial que seule la personne accorde. Ailleurs
 * qu'Android, rien à faire.
 */
export async function creerCanauxAndroid(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync("miam-safe", {
      name: "Miam Safe",
      description: "Quand quelqu'un a besoin d'aide : l'alerte du comptoir pour ton équipe, ou un pote qui te prévient.",
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: true,
      vibrationPattern: [0, 500, 250, 500],
    });
  } catch {
    // Module natif absent ou refus du système : les alertes arrivent quand même, sur le canal par défaut
  }
}
