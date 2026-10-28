import { Platform } from "react-native";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_LOCALISATION_PAR_LANGUE } from "~/contenus/textes-localisation";
import type { ErreurPosition } from "~/fonctions/geo/lire-position-telephone";
import { ecrireRepliDistances } from "~/fonctions/geo/ecrire-repli-distances";

export function ecrireErreurPosition(erreur: ErreurPosition, actualisation: boolean, depuisVille: string | null, langue: Langue): string {
  const T = choisirTextes(TEXTES_LOCALISATION_PAR_LANGUE, langue);
  const chemin = Platform.OS === "ios" ? T.cheminLocalisationIos : T.cheminLocalisationAndroid;
  const repli = actualisation ? ecrireRepliDistances(depuisVille, langue) : null;
  const enAttendant = repli ? T.enAttendant(repli) : "";
  if (erreur === "coupee") return T.coupee(chemin, enAttendant);
  if (erreur === "refus-definitif") return T.refusDefinitif(enAttendant);
  if (erreur === "introuvable") return actualisation ? T.introuvableActualisation : T.introuvable;
  if (!actualisation) return T.refusSansActualisation;
  return repli ? T.oublieeAvecRepli(repli) : T.oubliee;
}
