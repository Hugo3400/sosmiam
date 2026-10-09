// Le service de fidélité, version API (routes /app/fidelite, contrat dans apps/api/src/routes/visites.ts).

import type { CarteFidelite } from "../../types/fidelite.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceFidelite } from "../contrat-fidelite.ts";

export function creerFideliteApi(client: ClientHttp): ServiceFidelite {
  return {
    listerCartes: () => client.demander<{ cartes: CarteFidelite[] }>("GET", "/app/fidelite/cartes"),
    demanderRecompense: (lieuId) => client.demander<{ carte: CarteFidelite }>("POST", `/app/fidelite/cartes/${lieuId}/demande`),
    annulerDemandeRecompense: (lieuId) => client.demander<{ carte: CarteFidelite }>("DELETE", `/app/fidelite/cartes/${lieuId}/demande`),
  };
}
