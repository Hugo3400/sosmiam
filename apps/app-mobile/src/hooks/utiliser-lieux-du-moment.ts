import { useMemo } from "react";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ecrireCleSosFinis } from "~/fonctions/lieux/ecrire-cle-sos-finis";
import { retirerSosFinis } from "~/fonctions/lieux/retirer-sos-finis";

export function utiliserLieuxDuMoment(lieux: Lieu[], maintenant: Date): Lieu[] {
  const cleSosFinis = useMemo(() => ecrireCleSosFinis(lieux, maintenant), [lieux, maintenant]);
  return useMemo(() => retirerSosFinis(lieux, cleSosFinis), [lieux, cleSosFinis]);
}
