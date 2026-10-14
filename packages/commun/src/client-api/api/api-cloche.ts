// La cloche, version API (routes /app/cloche ; contrat dans contrat-cloche.ts).

import type { PageClocheApi } from "../../types/cloche.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceCloche } from "../contrat-cloche.ts";

export function creerClocheApi(client: ClientHttp): ServiceCloche {
  return {
    lister: (apres) => client.demander<{ cloche: PageClocheApi }>("GET", apres ? `/app/cloche?apres=${encodeURIComponent(apres)}` : "/app/cloche"),
    // Sans jusqua, le corps part vide ({}) : le serveur prend maintenant
    marquerVu: (jusqua) => client.demander<{ vuesLe: string }>("POST", "/app/cloche/vu", { corps: jusqua ? { jusqua } : {} }),
  };
}
