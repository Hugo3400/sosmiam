import { simplifierNom } from "../texte/simplifier-nom.ts";
import type { ResumeLieu } from "~/services/lieux.ts";

/**
 * Les valeurs d'un champ des lieux (« info » : Bar à tapas, Brasserie… ; « ville » : Montpellier, Sète…) avec leur
 * nombre de lieux : les plus fréquentes d'abord, puis par ordre alphabétique. « brasserie » et « Brasserie » comptent
 * ensemble, sous la première écriture rencontrée ; un champ vide n'est pas compté. `garder` : une valeur choisie qui
 * reste dans la liste même sans lieu (0), pour que le filtre en cours s'affiche toujours.
 */
export function compterValeursLieux(lieux: Pick<ResumeLieu, "info" | "ville">[], champ: "info" | "ville", garder = ""): { libelle: string; nombre: number }[] {
  const valeurs = new Map<string, { libelle: string; nombre: number }>();
  for (const lieu of lieux) {
    const cle = simplifierNom(lieu[champ]);
    if (!cle) continue;
    const valeur = valeurs.get(cle) ?? { libelle: lieu[champ].trim(), nombre: 0 };
    valeur.nombre++;
    valeurs.set(cle, valeur);
  }
  if (simplifierNom(garder) && !valeurs.has(simplifierNom(garder))) valeurs.set(simplifierNom(garder), { libelle: garder.trim(), nombre: 0 });
  return [...valeurs.values()].sort((a, b) => b.nombre - a.nombre || a.libelle.localeCompare(b.libelle, "fr"));
}
