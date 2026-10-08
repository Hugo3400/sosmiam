import type { GroupeLieux } from "~/contenus/villes";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

/** « Saint-Étienne » → « saint etienne » : sans accents, sans majuscules, tirets et apostrophes changés en espaces. */
function simplifier(texte: string): string {
  return normaliserRecherche(texte).replace(/[\s'’-]+/g, " ").trim();
}

/**
 * Garde les suggestions qui commencent comme ce qui est tapé, ou dont un mot commence ainsi :
 * « etienne » trouve Saint-Étienne, « ile de » trouve Île-de-France. Taper une région montre toute la région.
 * Rien de tapé : toutes les suggestions.
 */
export function filtrerLieux(saisie: string, groupes: GroupeLieux[]): GroupeLieux[] {
  const cherche = simplifier(saisie);
  if (!cherche) return groupes;
  const correspond = (nom: string) => {
    const texte = simplifier(nom);
    return texte.startsWith(cherche) || texte.split(" ").some((mot) => mot.startsWith(cherche));
  };
  return groupes
    .map((groupe) => (correspond(groupe.region) ? groupe : { ...groupe, lieux: groupe.lieux.filter((lieu) => correspond(lieu.nom)) }))
    .filter((groupe) => groupe.lieux.length > 0);
}
