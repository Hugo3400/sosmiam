import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { IdBadge } from "@sos-miam/commun/types/badge";

const CONNUS = new Set<string>(BADGES.map((badge) => badge.id));

export function listerBadgesDuCompte(badgesCompte: readonly string[]): IdBadge[] {
  return [...new Set(badgesCompte)].filter((id): id is IdBadge => CONNUS.has(id));
}
