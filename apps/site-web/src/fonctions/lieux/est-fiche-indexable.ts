import { LIEUX_NON_INDEXES } from "~/contenus/lieux-non-indexes";
import type { FichePublique } from "~/types/pro";

export function estFicheIndexable(lieu: Pick<FichePublique, "id" | "estVerifie" | "source">): boolean {
  if (LIEUX_NON_INDEXES.has(lieu.id)) return false;
  return lieu.estVerifie || lieu.source === null;
}
