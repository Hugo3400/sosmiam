import type { GroupeLieux, Lieu } from "~/contenus/villes";
import { simplifierRecherche } from "~/fonctions/texte/simplifier-recherche";

/**
 * Garde les suggestions qui commencent comme ce qui est tapé, ou dont un mot commence ainsi :
 * « etienne » trouve Saint-Étienne, « ile de » trouve Île-de-France, « paca » trouve Provence-Alpes-Côte d'Azur (noms courants).
 * Taper une région montre toute la région. Rien de tapé : toutes les suggestions.
 */
export function filtrerLieux(saisie: string, groupes: GroupeLieux[]): GroupeLieux[] {
  const cherche = simplifierRecherche(saisie);
  if (!cherche) return groupes;
  const correspond = (texte: string) => {
    const simple = simplifierRecherche(texte);
    return simple.startsWith(cherche) || simple.split(" ").some((mot) => mot.startsWith(cherche));
  };
  const lieuCorrespond = (lieu: Lieu) => [lieu.nom, ...lieu.alias].some(correspond);
  return groupes
    .map((groupe) => (lieuCorrespond(groupe.lieux[0]) ? groupe : { ...groupe, lieux: groupe.lieux.filter(lieuCorrespond) }))
    .filter((groupe) => groupe.lieux.length > 0);
}
