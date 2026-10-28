import { LIBELLES_MODE_VALIDATION_PAR_LANGUE } from "@sos-miam/commun/contenus/modes-validation";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { AvisPublic } from "@sos-miam/commun/types/avis";

import { TEXTES_CARTE_AVIS_PAR_LANGUE } from "~/contenus/textes-carte-avis";

export function ecrirePreuveAvis(avis: Pick<AvisPublic, "verifie" | "preuve">, langue: Langue): string {
  const T = choisirTextes(TEXTES_CARTE_AVIS_PAR_LANGUE, langue);
  if (!avis.verifie) return T.nonVerifie;
  return avis.preuve ? `${T.visiteVerifiee} · ${choisirTextes(LIBELLES_MODE_VALIDATION_PAR_LANGUE, langue)[avis.preuve]}` : T.visiteVerifiee;
}
