// Les « Ça m'intéresse » sur les événements, version API (session obligatoire, jamais en cache).

import type { MonInteretEvenement } from "../../types/evenement.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceInteretsEvenements } from "../contrat-interets-evenements.ts";

export function creerInteretsEvenementsApi(client: ClientHttp): ServiceInteretsEvenements {
  return {
    listerMesInterets: () => client.demander<{ interets: MonInteretEvenement[] }>("GET", "/app/evenements/mes-interets"),
    poserInteret: (id, rappel) => client.demander<{ interets: MonInteretEvenement[] }>("PUT", `/app/evenements/${id}/interet`, { corps: { rappel } }),
    retirerInteret: (id) => client.demander<{ interets: MonInteretEvenement[] }>("DELETE", `/app/evenements/${id}/interet`),
  };
}
