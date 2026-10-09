import { simplifierNom } from "../texte/simplifier-nom.ts";
import type { ResumeLieu } from "~/services/lieux.ts";

export type FiltresLieux = { type: string; categorie: string; ville: string; qualite?: "" | "a-completer" | "complete"; pro?: "" | "verifies" | "non-verifies" };

/**
 * Les lieux du type (« resto », « bar »…), de la catégorie (« Ce que c'est » : Bar à tapas, Brasserie…), de la ville et
 * de la qualité (fiche à compléter ou complète) et du compte pro (vérifié ✓ ou non) choisis, dans le même ordre ; vide : pas de filtre. Catégorie et ville
 * se comparent sans majuscules, accents, tirets ni espaces en trop (« saint-jean-de-vedas » trouve « Saint-Jean-de-Védas »).
 */
export function filtrerLieux<T extends Pick<ResumeLieu, "type" | "info" | "ville"> & { manques?: string[]; verifie?: boolean }>(
  lieux: T[],
  { type, categorie, ville, qualite = "", pro = "" }: FiltresLieux,
): T[] {
  const cleCategorie = simplifierNom(categorie);
  const cleVille = simplifierNom(ville);
  return lieux.filter((lieu) =>
    (!type || lieu.type === type)
    && (!cleCategorie || simplifierNom(lieu.info) === cleCategorie)
    && (!cleVille || simplifierNom(lieu.ville) === cleVille)
    && (!qualite || (qualite === "complete") === ((lieu.manques ?? []).length === 0))
    && (!pro || (pro === "verifies") === Boolean(lieu.verifie)));
}
