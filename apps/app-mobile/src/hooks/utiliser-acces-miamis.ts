import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type RaisonAccesMiamis = "compte" | "demo" | "visite" | "attente";

export function utiliserAccesMiamis(): { ouvert: boolean; raison: RaisonAccesMiamis } {
  const source = utiliserSourceSociale();
  return { ouvert: source === "compte", raison: source };
}
