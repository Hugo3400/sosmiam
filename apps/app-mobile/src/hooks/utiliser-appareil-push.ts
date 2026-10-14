import { useCallback, useMemo } from "react";

import { creerAppareilsApi } from "@sos-miam/commun/client-api/api/api-appareils";
import { lireJetonTelephone, type LectureJetonTelephone } from "~/fonctions/notifications/lire-jeton-telephone";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { effacerJetonPush, enregistrerJetonPush, lireJetonPush } from "~/stockage/jeton-push";

/**
 * Le téléphone et les notifications : l'inscrire sur le serveur (jeton natif, plateforme, ta ville ; lié à ton compte si tu
 * es connecté) ou l'en retirer. Rien en démo (pas de serveur). `inscrire(demander)` : poser la question au système si besoin.
 */
export function utiliserAppareilPush() {
  const { client } = utiliserSession();
  const { profil } = utiliserProfil();
  const appareils = useMemo(() => creerAppareilsApi(client), [client]);
  const ville = profil?.ville ?? null;

  const inscrire = useCallback(
    async (demander: boolean): Promise<LectureJetonTelephone["ok"] | "refusee" | "a-demander" | "indisponible"> => {
      if (DEMO_VISITES_ACTIVE) return "indisponible";
      const lu = await lireJetonTelephone(demander);
      if (!lu.ok) return lu.raison;
      const r = await appareils.inscrire({ jeton: lu.jeton, plateforme: lu.plateforme, ville: ville || null });
      if (r.ok) await enregistrerJetonPush(lu.jeton);
      return r.ok;
    },
    [appareils, ville],
  );

  const couper = useCallback(async () => {
    const jeton = await lireJetonPush();
    if (!jeton || DEMO_VISITES_ACTIVE) return;
    const r = await appareils.desinscrire(jeton);
    if (r.ok) await effacerJetonPush();
  }, [appareils]);

  return { inscrire, couper };
}
