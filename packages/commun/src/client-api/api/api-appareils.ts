// L'inscription du téléphone aux notifications, version API (PUT et DELETE /app/appareils, jamais en cache).

import type { ClientHttp } from "../client-http.ts";
import type { ServiceAppareils } from "../contrat-appareils.ts";

export function creerAppareilsApi(client: ClientHttp): ServiceAppareils {
  return {
    // Avec la session si un compte est connecté (le téléphone lui est lié), sans sinon
    inscrire: (inscription) => client.demander("PUT", "/app/appareils", { corps: inscription }),
    // Jamais avec la session : un téléphone se désinscrit même après la déconnexion
    desinscrire: (jeton) => client.demander("DELETE", "/app/appareils", { corps: { jeton }, session: false }),
  };
}
