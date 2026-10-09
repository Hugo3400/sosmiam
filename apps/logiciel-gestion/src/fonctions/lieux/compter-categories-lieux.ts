import { simplifierNom } from "../texte/simplifier-nom.ts";
import type { ResumeLieu } from "~/services/lieux.ts";

/**
 * Les catégories des lieux (« Ce que c'est » : Bar à tapas, Brasserie…) avec leur nombre de lieux : les plus fréquentes
 * d'abord, puis par ordre alphabétique. « brasserie » et « Brasserie » comptent ensemble, sous la première écriture
 * rencontrée ; un lieu sans catégorie n'est pas compté.
 */
export function compterCategoriesLieux(lieux: Pick<ResumeLieu, "info">[]): { libelle: string; nombre: number }[] {
  const categories = new Map<string, { libelle: string; nombre: number }>();
  for (const { info } of lieux) {
    const cle = simplifierNom(info);
    if (!cle) continue;
    const categorie = categories.get(cle) ?? { libelle: info.trim(), nombre: 0 };
    categorie.nombre++;
    categories.set(cle, categorie);
  }
  return [...categories.values()].sort((a, b) => b.nombre - a.nombre || a.libelle.localeCompare(b.libelle, "fr"));
}
