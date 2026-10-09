// Le service Miam Safe, version API (routes /miam-safe, contrat dans apps/api/src/routes/miam-safe.ts).

import type { AlerteComptoir, AlerteSuivie, CharteMiamSafe, MiamSafeLieu } from "../../types/miam-safe.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceMiamSafe } from "../contrat-miam-safe.ts";

export function creerMiamSafeApi(client: ClientHttp): ServiceMiamSafe {
  return {
    lireLieu: (lieuId) => client.demander<MiamSafeLieu>("GET", `/miam-safe/lieux/${lieuId}`, { session: false }),
    envoyerAlerte: (alerte) => client.demander<{ id: number }>("POST", "/miam-safe/alertes", { corps: alerte }),
    suivreAlerte: (alerteId) => client.demander<{ alerte: AlerteSuivie }>("GET", `/miam-safe/alertes/${alerteId}`),
    signaler: (signalement) => client.demander("POST", "/miam-safe/signalements", { corps: signalement }),
    repondreSentiBien: (lieuId, oui) => client.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { corps: { oui } }),
    listerAlertesComptoir: (lieuId) => client.demander<{ alertes: AlerteComptoir[] }>("GET", `/miam-safe/pro/lieux/${lieuId}/alertes`),
    direOnArrive: (lieuId, alerteId) => client.demander("POST", `/miam-safe/pro/lieux/${lieuId}/alertes/${alerteId}/on-arrive`),
    lireCharte: (lieuId) => client.demander<{ charte: CharteMiamSafe }>("GET", `/miam-safe/pro/lieux/${lieuId}/charte`),
    signerCharte: (lieuId) => client.demander<{ charte: CharteMiamSafe }>("PUT", `/miam-safe/pro/lieux/${lieuId}/charte`, { corps: { accepte: true } }),
    quitterCharte: (lieuId) => client.demander<{ charte: CharteMiamSafe }>("DELETE", `/miam-safe/pro/lieux/${lieuId}/charte`),
  };
}
