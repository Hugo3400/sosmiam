import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import type { AvisPublic } from "@sos-miam/commun/types/avis";

export function filtrerAvisSelonAge(avis: readonly AvisPublic[], age: number | null): AvisPublic[] {
  if (age !== null) return [...avis];
  return avis.filter((a) => !parleDAlcool(a.texte) && !parleDAlcool(a.reponseLieu?.texte));
}
