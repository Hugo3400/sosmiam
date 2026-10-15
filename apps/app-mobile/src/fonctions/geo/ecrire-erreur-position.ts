import { Platform } from "react-native";

import type { ErreurPosition } from "~/fonctions/geo/lire-position-telephone";
import { ecrireRepliDistances } from "~/fonctions/geo/ecrire-repli-distances";

const CHEMIN_LOCALISATION =
  Platform.OS === "ios" ? "Réglages > Confidentialité et sécurité > Service de localisation" : "les réglages du téléphone (Localisation)";

export function ecrireErreurPosition(erreur: ErreurPosition, actualisation: boolean, depuisVille: string | null): string {
  const repli = actualisation ? ecrireRepliDistances(depuisVille) : null;
  const enAttendant = repli ? ` En attendant, ${repli}.` : "";
  if (erreur === "coupee") return `Ta localisation est éteinte : allume-la dans ${CHEMIN_LOCALISATION}.${enAttendant}`;
  if (erreur === "refus-definitif") return `SOS Miam n'a pas accès à ta position : tu peux l'autoriser dans les réglages du téléphone.${enAttendant}`;
  if (erreur === "introuvable") {
    return actualisation ? "On ne te retrouve pas pour l'instant : on garde ta position d'avant." : "On ne te trouve pas pour l'instant : réessaie dans un instant.";
  }
  if (!actualisation) return "Pas de souci : la liste suit tes envies 💛";
  return repli ? `Pas de souci : ta position est oubliée, ${repli} 💛` : "Pas de souci : ta position est oubliée 💛";
}
