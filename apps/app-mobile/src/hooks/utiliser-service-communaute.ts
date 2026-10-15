import type { ServicesSociaux } from "@sos-miam/commun/client-api/services-sociaux";
import { utiliserSession } from "~/hooks/utiliser-session";
import type { ServiceCommunauteAttendu } from "~/services/contrat-communaute-attendu";

type ServicesAvecCommunaute = ServicesSociaux & { communaute?: ServiceCommunauteAttendu };

export function utiliserServiceCommunaute(): ServiceCommunauteAttendu | null {
  const { sociaux } = utiliserSession();
  return (sociaux as ServicesAvecCommunaute).communaute ?? null;
}
