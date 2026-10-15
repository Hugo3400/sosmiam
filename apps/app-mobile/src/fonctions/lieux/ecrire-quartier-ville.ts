import type { Lieu } from "@sos-miam/commun/types/lieu";

/**
 * Où est le lieu, en clair : « Écusson, Montpellier », ou seulement « Lyon » quand son quartier n'est pas renseigné (jamais
 * « , Lyon »). Les morceaux vides sont sautés, séparateur compris.
 */
export function ecrireQuartierVille(lieu: Pick<Lieu, "quartier" | "ville">, separateur = ", "): string {
  return [lieu.quartier, lieu.ville]
    .map((morceau) => (morceau ?? "").trim())
    .filter((morceau) => morceau !== "")
    .join(separateur);
}
