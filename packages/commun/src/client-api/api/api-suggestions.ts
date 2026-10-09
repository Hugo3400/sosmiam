// Le service « Proposer une modification », version API (POST /comptes/moi/suggestions, routes/comptes.ts de l'API).

import type { ClientHttp } from "../client-http.ts";
import type { ServiceSuggestions } from "../contrat-suggestions.ts";

export function creerSuggestionsApi(client: ClientHttp): ServiceSuggestions {
  return {
    proposer: (lieuId, suggestion) =>
      client.demander<{ id: number }>("POST", "/comptes/moi/suggestions", { corps: { lieuId, proposition: suggestion.proposition, message: suggestion.message ?? undefined } }),
  };
}
