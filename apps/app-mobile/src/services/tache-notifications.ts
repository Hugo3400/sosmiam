import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { AppState, Platform } from "react-native";

import { dechiffrerApercu } from "~/fonctions/notifications/dechiffrer-apercu";
import { estDejaSousTesYeux } from "~/fonctions/notifications/est-deja-sous-tes-yeux";
import { estLienPermis } from "~/fonctions/notifications/est-lien-permis";
import { lireEcranOuvert } from "~/services/ecran-ouvert";
import { CATEGORIE_MESSAGE, preparerCategorieMessage, repondreDepuisNotification } from "~/services/reponse-notification";
import { lireCleApercu } from "~/stockage/cle-apercu";

const TACHE_NOTIFICATIONS = "sosmiam-notifications";
const FORME_REGROUPEMENT = /^conversation:\d{1,12}$/;

const lireTexte = (objet: Record<string, unknown>, champ: string): string | null =>
  typeof objet[champ] === "string" && objet[champ] ? (objet[champ] as string) : null;

async function remplacerParApercu(donnees: Record<string, unknown>): Promise<void> {
  const chiffre = lireTexte(donnees, "apercu");
  const tag = lireTexte(donnees, "tag");
  if (!chiffre || !tag || !FORME_REGROUPEMENT.test(tag)) return;
  const cle = await lireCleApercu();
  const apercu = cle ? await dechiffrerApercu(chiffre, cle) : null;
  if (!apercu) return;
  const lien = estLienPermis(donnees.lien) ? donnees.lien : null;
  if (AppState.currentState === "active" && estDejaSousTesYeux(lien, lireEcranOuvert())) return;
  const badge = Number(lireTexte(donnees, "badge") ?? NaN);
  await Notifications.scheduleNotificationAsync({
    identifier: tag,
    content: {
      title: apercu.titre,
      body: apercu.texte,
      data: { ...(lien ? { lien } : {}), tag },
      ...(lireTexte(donnees, "categoryId") === CATEGORIE_MESSAGE ? { categoryIdentifier: CATEGORIE_MESSAGE } : {}),
      ...(Number.isSafeInteger(badge) && badge >= 0 ? { badge } : {}),
    },
    trigger: { channelId: "messages-discrets" },
  });
}

if (Platform.OS === "android") {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(TACHE_NOTIFICATIONS, async ({ data }) => {
    try {
      if (!data) return;
      if ("actionIdentifier" in data) return await repondreDepuisNotification(data);
      if (typeof data.data === "object" && data.data !== null) await remplacerParApercu(data.data);
    } catch {
      return;
    }
  });
  void Notifications.registerTaskAsync(TACHE_NOTIFICATIONS).catch(() => null);
}

if (Platform.OS !== "web") {
  preparerCategorieMessage();
  Notifications.addNotificationResponseReceivedListener((reponse) => void repondreDepuisNotification(reponse));
}
