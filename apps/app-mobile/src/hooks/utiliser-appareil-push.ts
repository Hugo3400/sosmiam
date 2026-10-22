import { useMemo } from "react";
import { Platform } from "react-native";

import { creerAppareilsApi } from "@sos-miam/commun/client-api/api/api-appareils";
import { demanderAutorisationNotifications } from "~/fonctions/notifications/demander-autorisation-notifications";
import { lireJetonTelephone } from "~/fonctions/notifications/lire-jeton-telephone";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { creerTelephoneNotifications } from "~/services/telephone-notifications";
import { lireCleApercuPourServeur } from "~/stockage/cle-apercu";

/**
 * Le téléphone et les notifications : l'inscrire sur le serveur (jeton natif, plateforme, ta ville ; lié à ton compte si tu
 * es connecté) ou l'en retirer. Rien en démo (pas de serveur).
 */
export function utiliserAppareilPush() {
  const { client, connecte } = utiliserSession();
  const { profil } = utiliserProfil();
  const ville = profil?.ville ?? null;

  return useMemo(
    () =>
      creerTelephoneNotifications({
        appareils: creerAppareilsApi(client),
        ville,
        demo: DEMO_VISITES_ACTIVE,
        plateforme: Platform.OS,
        lireJeton: lireJetonTelephone,
        demanderAutorisation: demanderAutorisationNotifications,
        lireCleApercu: connecte ? lireCleApercuPourServeur : undefined,
      }),
    [client, ville, connecte],
  );
}
