import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { BadgeCatalogue } from "@sos-miam/commun/types/badge";

export function choisirDerniersBadges(obtenus: readonly string[], nombre: number): BadgeCatalogue[] {
  const badges = obtenus.flatMap((id) => BADGES.find((badge) => badge.id === id) ?? []);
  return badges.slice(Math.max(0, badges.length - Math.max(0, nombre))).reverse();
}
