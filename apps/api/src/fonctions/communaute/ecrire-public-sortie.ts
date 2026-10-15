import type { PublicSortieMiamis } from "../../../../../packages/commun/src/types/sorties-miamis.ts";

export function ecrirePublicSortie(p: PublicSortieMiamis): { publicType: string; publicValeur: string | null } {
  if (p.type === "genre") return { publicType: "genre", publicValeur: p.genre };
  if (p.type === "age") return { publicType: "age", publicValeur: p.tranche };
  return { publicType: p.type, publicValeur: null };
}
