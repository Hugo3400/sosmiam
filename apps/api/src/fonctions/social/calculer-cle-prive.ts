/**
 * La clé d'une discussion privée entre deux comptes : « <plus petit id>-<plus grand> », dans les deux sens la même. Elle
 * est unique en base (Conversation.clePrive) : une seule discussion privée par paire, gardée si l'un des deux part. Elle ne
 * sort jamais de l'API (ce sont des id de comptes).
 */
export function calculerClePrive(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}
