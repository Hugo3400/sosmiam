import * as Notifications from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { lireLienNotification } from "~/fonctions/notifications/lire-lien-notification";
import { utiliserAppareilPush } from "~/hooks/utiliser-appareil-push";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { lireReglagesNotifications } from "~/stockage/reglages-notifications";

// Une notification qui arrive pendant que l'app est ouverte s'affiche quand même, sans son
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/**
 * À la racine de l'app : le téléphone s'inscrit aux notifications quand il y a un profil et que « Recevoir des
 * notifications » est allumé (la question du système est posée une fois, au premier lancement avec un profil), puis à chaque
 * connexion ou déconnexion (le téléphone est lié au compte, ou délié) et quand la ville change. Toucher une notification
 * ouvre son écran (son « lien »), même quand elle a lancé l'app.
 */
export function utiliserInscriptionTelephone(): void {
  const router = useRouter();
  const { pret, connecte } = utiliserSession();
  const { profil } = utiliserProfil();
  const { inscrire } = utiliserAppareilPush();
  const avecProfil = profil !== null;

  useEffect(() => {
    if (!pret || !avecProfil) return;
    let actif = true;
    lireReglagesNotifications().then((reglages) => {
      if (actif && reglages.actives) void inscrire(true);
    });
    return () => {
      actif = false;
    };
    // connecte : une connexion lie le téléphone au compte, une déconnexion l'en délie
  }, [pret, connecte, avecProfil, inscrire]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const ouvrir = (reponse: Notifications.NotificationResponse | null) => {
      const lien = lireLienNotification(reponse?.notification.request.content.data);
      if (lien) router.push(lien as Href);
    };
    Notifications.getLastNotificationResponseAsync().then(ouvrir).catch(() => {});
    const abonnement = Notifications.addNotificationResponseReceivedListener(ouvrir);
    return () => abonnement.remove();
  }, [router]);
}
