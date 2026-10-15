import * as Notifications from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { creerCanauxAndroid } from "~/fonctions/notifications/creer-canaux-android";
import { estAlerteMiamSafe } from "~/fonctions/notifications/est-alerte-miam-safe";
import { estDejaSousTesYeux } from "~/fonctions/notifications/est-deja-sous-tes-yeux";
import { lireLienNotification } from "~/fonctions/notifications/lire-lien-notification";
import { utiliserAppareilPush } from "~/hooks/utiliser-appareil-push";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { lireEcranOuvert } from "~/services/ecran-ouvert";
import { lireReglagesNotifications } from "~/stockage/reglages-notifications";

/**
 * Une notification reçue app ouverte s'affiche, sauf si son message est déjà sous tes yeux (son écran est ouvert, et à
 * jour) ; elle reste muette, sauf une alerte Miam Safe, qui doit s'entendre même si tu regardes un autre écran
 */
const presenter = (notification: Notifications.Notification): { afficher: boolean; sonner: boolean } => {
  try {
    const lien = lireLienNotification(notification);
    const sonner = estAlerteMiamSafe(lien);
    return { afficher: sonner || !estDejaSousTesYeux(lien, lireEcranOuvert()), sonner };
  } catch {
    // Dans le doute, la notification s'affiche, sans son
    return { afficher: true, sonner: false };
  }
};

if (Platform.OS !== "web") {
  // Une notification qui arrive pendant que l'app est ouverte s'affiche quand même, sauf si son écran est déjà ouvert
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { afficher, sonner } = presenter(notification);
      return { shouldShowBanner: afficher, shouldShowList: afficher, shouldPlaySound: sonner, shouldSetBadge: false };
    },
  });
  // Android : le canal « Miam Safe » des alertes urgentes, avant toute demande d'autorisation
  void creerCanauxAndroid();
}

/**
 * La dernière notification touchée déjà ouverte : la même peut arriver deux fois (au lancement de l'app et par l'écoute).
 * L'identifiant seul ne suffit pas : sur iPhone, les messages d'une même conversation partagent le leur (apns-collapse-id),
 * d'où la date d'arrivée en plus.
 */
let derniereOuverte: string | null = null;

/**
 * À la racine de l'app : le téléphone s'inscrit aux notifications quand il y a un profil et que « Recevoir des
 * notifications » est allumé (la question du système est posée une fois, au premier lancement avec un profil), puis à chaque
 * connexion ou déconnexion (le téléphone est lié au compte, ou délié) et quand la ville change. Toucher une notification
 * ouvre son écran (son « lien »), même quand elle a lancé l'app : seulement une fois la pile d'écrans affichée (`pileAffichee`),
 * sinon la navigation partirait avant elle. Un écran déjà ouvert n'est pas empilé une deuxième fois.
 */
export function utiliserInscriptionTelephone(pileAffichee: boolean): void {
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
    if (Platform.OS === "web" || !pileAffichee) return;
    const ouvrir = (reponse: Notifications.NotificationResponse | null) => {
      if (!reponse) return;
      const cle = `${reponse.notification.request.identifier}@${reponse.notification.date}`;
      if (cle === derniereOuverte) return;
      derniereOuverte = cle;
      try {
        // Ouverte : on l'oublie, pour ne pas la rouvrir au prochain affichage de la pile (après « Quitter la démo »)
        Notifications.clearLastNotificationResponse();
      } catch {
        // Pas disponible ici : l'identifiant gardé suffit
      }
      const lien = lireLienNotification(reponse.notification);
      if (lien && lien !== lireEcranOuvert()) router.push(lien as Href);
    };
    try {
      ouvrir(Notifications.getLastNotificationResponse());
    } catch {
      // Pas de module natif (navigateur, Expo Go selon les versions) : rien à rouvrir
    }
    const abonnement = Notifications.addNotificationResponseReceivedListener(ouvrir);
    return () => abonnement.remove();
  }, [router, pileAffichee]);
}
