import type { Lieu } from "@sos-miam/commun/types/lieu";

import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";

export function ecrireCleSosFinis(lieux: Lieu[], maintenant: Date): string {
  let cle = "";
  for (const lieu of lieux) {
    if (!lieu.sos || estSosEnCours(lieu, maintenant)) continue;
    cle = cle === "" ? String(lieu.id) : `${cle},${lieu.id}`;
  }
  return cle;
}
