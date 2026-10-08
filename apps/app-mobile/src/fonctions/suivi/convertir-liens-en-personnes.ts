import type { Pote } from "@sos-miam/commun/types/potes";
import type { LienSuivi } from "@sos-miam/commun/types/suivis";

import type { PersonneLiee } from "~/hooks/utiliser-suivis-personnes";

/** Tes liens en personnes connues (les inconnues sont laissées de côté), de la plus récente à la plus ancienne. */
export function convertirLiensEnPersonnes(liens: readonly LienSuivi[], trouverPote: (id: string) => Pote | null): PersonneLiee[] {
  return liens
    .flatMap((lien): PersonneLiee[] => {
      const pote = trouverPote(lien.id);
      if (!pote) return [];
      return [lien.surveillance ? { pote, depuis: lien.depuis, surveillance: true } : { pote, depuis: lien.depuis }];
    })
    .sort((a, b) => b.depuis.localeCompare(a.depuis));
}
