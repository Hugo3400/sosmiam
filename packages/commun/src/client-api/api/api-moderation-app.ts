// Les décisions de la modération vues dans l'app, version API (routes /app/moderation ; contrat dans
// contrat-moderation-app.ts).

import type { DecisionModerationApi } from "../../types/signalement.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceModerationApp } from "../contrat-moderation-app.ts";

export function creerModerationAppApi(client: ClientHttp): ServiceModerationApp {
  return {
    listerDecisions: () => client.demander<{ decisions: DecisionModerationApi[] }>("GET", "/app/moderation/mes-decisions"),
    contester: (signalementId, texte) =>
      client.demander("POST", `/app/moderation/${encodeURIComponent(signalementId)}/contestation`, { corps: { texte } }),
  };
}
