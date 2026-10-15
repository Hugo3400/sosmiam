import { utiliserServiceCommunaute } from "~/hooks/utiliser-service-communaute";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type RaisonAccesMiamis = "compte" | "demo" | "visite" | "attente" | "service-absent";

export function utiliserAccesMiamis(): { ouvert: boolean; raison: RaisonAccesMiamis } {
  const source = utiliserSourceSociale();
  const service = utiliserServiceCommunaute();
  if (source !== "compte") return { ouvert: false, raison: source };
  if (!service) return { ouvert: false, raison: "service-absent" };
  return { ouvert: true, raison: "compte" };
}
