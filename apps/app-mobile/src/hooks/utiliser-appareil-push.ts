import { useCallback, useMemo } from "react";
import { Platform } from "react-native";

import { creerAppareilsApi } from "@sos-miam/commun/client-api/api/api-appareils";
import { envoyerOffresTelephone } from "~/fonctions/notifications/envoyer-offres-telephone";
import { lireJetonTelephone, type LectureJetonTelephone } from "~/fonctions/notifications/lire-jeton-telephone";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { renvoiChoixOffres, type IssueEnvoiOffres } from "~/services/renvoi-choix-offres";
import { effacerJetonPush, enregistrerJetonPush, lireJetonPush } from "~/stockage/jeton-push";
import { lireReglagesNotifications } from "~/stockage/reglages-notifications";

const ATTENTE_MAX_MS = 20_000;

let fileTelephone: Promise<unknown> = Promise.resolve();

function envoyerALaSuite<T>(tache: () => Promise<T>): Promise<T> {
  const tour = fileTelephone.then(tache);
  fileTelephone = Promise.race([tour.catch(() => undefined), new Promise((fini) => setTimeout(fini, ATTENTE_MAX_MS))]);
  return tour;
}

/**
 * Le téléphone et les notifications : l'inscrire sur le serveur (jeton natif, plateforme, ta ville ; lié à ton compte si tu
 * es connecté) ou l'en retirer. Rien en démo (pas de serveur).
 */
export function utiliserAppareilPush() {
  const { client } = utiliserSession();
  const { profil } = utiliserProfil();
  const appareils = useMemo(() => creerAppareilsApi(client), [client]);
  const ville = profil?.ville ?? null;

  const inscrire = useCallback(
    (demander: boolean, offres: boolean): Promise<LectureJetonTelephone["ok"] | "refusee" | "a-demander" | "indisponible"> => envoyerALaSuite(async () => {
      if (DEMO_VISITES_ACTIVE) return "indisponible";
      const lu = await lireJetonTelephone(demander);
      if (!lu.ok) return lu.raison;
      const r = await appareils.inscrire({ jeton: lu.jeton, plateforme: lu.plateforme, ville: ville || null, offres });
      if (r.ok) await enregistrerJetonPush(lu.jeton);
      return r.ok;
    }),
    [appareils, ville],
  );

  const envoyerOffres = useCallback(
    (offres: boolean): Promise<IssueEnvoiOffres> => envoyerALaSuite(() => envoyerOffresTelephone(offres, {
      demo: DEMO_VISITES_ACTIVE,
      ville,
      plateforme: Platform.OS,
      lireActives: async () => (await lireReglagesNotifications()).actives,
      lireJeton: lireJetonTelephone,
      lireJetonGarde: lireJetonPush,
      inscrire: (inscription) => appareils.inscrire(inscription),
      enregistrerJeton: enregistrerJetonPush,
    })),
    [appareils, ville],
  );

  const choisirOffres = useCallback((offres: boolean) => renvoiChoixOffres.choisir(offres, envoyerOffres), [envoyerOffres]);
  const renvoyerOffres = useCallback(() => renvoiChoixOffres.renvoyer(envoyerOffres), [envoyerOffres]);

  const couper = useCallback(() => envoyerALaSuite(async () => {
    const jeton = await lireJetonPush();
    if (!jeton || DEMO_VISITES_ACTIVE) return;
    const r = await appareils.desinscrire(jeton);
    if (r.ok) await effacerJetonPush();
  }), [appareils]);

  return { inscrire, couper, choisirOffres, renvoyerOffres };
}
