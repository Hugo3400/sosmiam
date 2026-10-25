import { ecrireIdentifiantVille } from "~/fonctions/page-lieux/ecrire-identifiant-ville";
import type { VilleLieux } from "~/types/lieux";

export function trouverVille(nom: string, villes: readonly VilleLieux[]): VilleLieux | null {
  const cherche = ecrireIdentifiantVille(nom);
  if (!cherche) return null;
  return villes.find((ville) => ecrireIdentifiantVille(ville.ville) === cherche) ?? null;
}
