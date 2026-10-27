import type { LieuCiteActus } from "../../../../../packages/commun/src/types/actus.ts";

export function estLieuAvecFiche(lieu: Pick<LieuCiteActus, "id">): boolean {
  return Number.isSafeInteger(lieu.id) && lieu.id > 0;
}
