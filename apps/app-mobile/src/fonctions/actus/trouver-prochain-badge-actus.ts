import { BADGES_ACTUS } from "@sos-miam/commun/regles/actus";

export type ProchainBadgeActus = (typeof BADGES_ACTUS)[number];

export function trouverProchainBadgeActus(publies: number): ProchainBadgeActus | null {
  return BADGES_ACTUS.find((badge) => badge.objectif > publies) ?? null;
}
