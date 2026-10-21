import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";

import { clientApiPublic } from "~/services/client-api-public";

export type VersionsAppServeur = { minimale?: unknown; derniere?: unknown };

export function lireVersionsAppServeur(): Promise<ReponseApi<VersionsAppServeur>> {
  return clientApiPublic.demander<VersionsAppServeur>("GET", "/app/version", { session: false });
}
