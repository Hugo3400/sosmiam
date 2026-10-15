import type { ServiceCommunaute } from "@sos-miam/commun/client-api/contrat-communaute";
import { utiliserSession } from "~/hooks/utiliser-session";

export function utiliserServiceCommunaute(): ServiceCommunaute {
  return utiliserSession().sociaux.communaute;
}
