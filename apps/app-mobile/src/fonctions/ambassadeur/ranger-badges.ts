import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { BadgeCatalogue } from "@sos-miam/commun/types/badge";

export function rangerBadges(obtenus: readonly string[]): BadgeCatalogue[] {
  const dejaObtenus = BADGES.filter((b) => obtenus.includes(b.id));
  const aDebloquer = BADGES.filter((b) => !obtenus.includes(b.id));
  return [...dejaObtenus, ...aDebloquer];
}
