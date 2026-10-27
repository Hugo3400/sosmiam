import { useMemo } from "react";

import { creerActusApi } from "@sos-miam/commun/client-api/api/api-actus";
import { utiliserSession } from "~/hooks/utiliser-session";

export function utiliserServiceActus() {
  const { client } = utiliserSession();
  return useMemo(() => ({ service: creerActusApi(client), client }), [client]);
}
