// Les signalements des contenus sociaux, version API (routes /app/signalements ; contrat dans
// contrat-signalements-sociaux.ts). Seuls les champs attendus partent : jamais la date ni un autre champ de l'app.

import type { ClientHttp } from "../client-http.ts";
import type { ServiceSignalementsSociaux } from "../contrat-signalements-sociaux.ts";

export function creerSignalementsSociauxApi(client: ClientHttp): ServiceSignalementsSociaux {
  return {
    signaler: ({ cible, cibleId, raison, precision, explication }) =>
      client.demander<{ masquePourTous?: boolean; deja?: boolean }>("POST", "/app/signalements", { corps: { cible, cibleId, raison, precision, explication } }),
    listerMiens: (cible) => client.demander<{ cibleIds: string[] }>("GET", `/app/signalements/miens?cible=${encodeURIComponent(cible)}`),
  };
}
