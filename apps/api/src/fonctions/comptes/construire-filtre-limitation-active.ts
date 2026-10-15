import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";

export function construireFiltreLimitationActive(maintenant: Date): Prisma.LimitationCompteWhereInput {
  return { leveeLe: null, debut: { lte: maintenant }, OR: [{ fin: null }, { fin: { gt: maintenant } }] };
}
