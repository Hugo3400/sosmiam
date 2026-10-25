import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

export function ecrireIdentifiantVille(ville: string): string {
  return normaliserRecherche(ville).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
