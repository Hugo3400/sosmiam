import type { Lieu } from "@sos-miam/commun/types/lieu";

const LIEU_POUR_BOIRE = /(?<!\p{L})(bars?|pubs?|caves? [àa] (vins?|bi[eè]res?)|cavistes?|(micro-?)?brasseries? artisanales?|brewpubs?)(?!\p{L})/iu;
const BARS_SANS_ALCOOL = /(?<!\p{L})bars? [àa] (hu[iî]tres|fruits|jus|smoothies?|salades?|soupes?|lait|caf[eé]s?)(?!\p{L})/iu;

export function estLieuPourBoire(lieu: Pick<Lieu, "type" | "info">): boolean {
  if (lieu.type === "bar") return true;
  const info = lieu.info ?? "";
  return LIEU_POUR_BOIRE.test(info) && !BARS_SANS_ALCOOL.test(info);
}
