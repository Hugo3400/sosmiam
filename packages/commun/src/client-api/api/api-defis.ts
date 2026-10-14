// Le service des défis, version API (GET /app/defis, contrat dans apps/api/src/routes/defis.ts).

import type { DefiApp } from "../../types/defi.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceDefis } from "../contrat-defis.ts";

export function creerDefisApi(client: ClientHttp): ServiceDefis {
  return {
    listerDefis: () => client.demander<{ defis: DefiApp[] }>("GET", "/app/defis"),
  };
}
