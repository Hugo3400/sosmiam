import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { creerClientHttp } from "@sos-miam/commun/client-api/client-http";
import { creerMessagerieApi } from "@sos-miam/commun/client-api/api/api-messagerie";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import { T_REPONSE_NOTIFICATION } from "~/contenus/textes-reponse-notification";
import { calculerIdClientReponse } from "~/fonctions/chat/calculer-id-client-reponse";
import { lireConversationNotification } from "~/fonctions/notifications/lire-conversation-notification";
import { ADRESSE_API } from "~/services/adresse-api";
import { lireLangueActuelle } from "~/services/langue-actuelle";
import { VERSION_INSTALLEE } from "~/services/version-installee";
import { lireJetonSession } from "~/stockage/session-compte";

export const CATEGORIE_MESSAGE = "message";
export const ACTION_REPONDRE = "repondre";

const messagerie = creerMessagerieApi(creerClientHttp({ adresse: ADRESSE_API, lireJeton: lireJetonSession, versionApp: VERSION_INSTALLEE ?? undefined, lireLangue: lireLangueActuelle }));
const dejaEnvoyees = new Set<string>();

export function preparerCategorieMessage(): void {
  if (Platform.OS === "web") return;
  void Notifications.setNotificationCategoryAsync(CATEGORIE_MESSAGE, [
    {
      identifier: ACTION_REPONDRE,
      buttonTitle: T_REPONSE_NOTIFICATION.bouton,
      textInput: { submitButtonTitle: T_REPONSE_NOTIFICATION.envoyer, placeholder: T_REPONSE_NOTIFICATION.champ },
      options: { opensAppToForeground: false, isAuthenticationRequired: true },
    },
  ]).catch(() => null);
}

export const estReponseDepuisNotification = (reponse: Notifications.NotificationResponse | null | undefined): boolean =>
  reponse?.actionIdentifier === ACTION_REPONDRE;

async function prevenirEchec(conversationId: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: T_REPONSE_NOTIFICATION.rateTitre, body: T_REPONSE_NOTIFICATION.rateTexte, data: { lien: `/potes/discussion/${conversationId}` } },
    trigger: Platform.OS === "android" ? { channelId: "messages-discrets" } : null,
  }).catch(() => undefined);
}

export async function repondreDepuisNotification(reponse: Notifications.NotificationResponse | null | undefined): Promise<void> {
  if (!reponse || !estReponseDepuisNotification(reponse)) return;
  const { notification } = reponse;
  const cle = `${notification.request.identifier}@${notification.date}`;
  const texte = (reponse.userText ?? "").trim().slice(0, LONGUEUR_MAX_MESSAGE);
  const conversationId = lireConversationNotification(notification);
  if (!texte || !conversationId || dejaEnvoyees.has(cle)) return;
  dejaEnvoyees.add(cle);
  let partie = false;
  try {
    const idClient = await calculerIdClientReponse(`${cle}|${texte}`);
    partie = (await messagerie.envoyerTexte(String(conversationId), idClient, texte)).ok;
  } catch {
    partie = false;
  }
  if (Platform.OS === "android") await Notifications.dismissNotificationAsync(notification.request.identifier).catch(() => undefined);
  if (!partie) {
    dejaEnvoyees.delete(cle);
    await prevenirEchec(conversationId);
  }
}
