import type { GroupeLieux, Lieu } from "~/contenus/villes";
import { simplifierRecherche } from "~/fonctions/texte/simplifier-recherche";

/**
 * Garde les suggestions qui commencent comme ce qui est tapé, ou dont un mot commence ainsi :
 * « etienne » trouve Saint-Étienne, « st etienne » aussi, « ile de » trouve Île-de-France, « paca » trouve Provence-Alpes-Côte d'Azur.
 * Taper une région montre toute la région. Rien de tapé : toutes les suggestions.
 */
export function filtrerLieux(saisie: string, groupes: GroupeLieux[]): GroupeLieux[] {
  const cherche = simplifierRecherche(saisie);
  if (!cherche) return groupes;
  // Le texte tapé doit commencer un mot du nom : « val de loire » trouve Centre-Val de Loire, « loire » aussi
  const correspondre = (texte: string) => ` ${simplifierRecherche(texte)}`.includes(` ${cherche}`);
  // On compare aussi la valeur, pour qu'un homonyme choisi (« Saint-Denis (La Réunion) ») soit retrouvé en rouvrant la liste
  const verifierLieu = (lieu: Lieu) => [lieu.nom, lieu.valeur, ...lieu.alias].some(correspondre);
  return groupes
    .map((groupe) => (verifierLieu(groupe.lieux[0]) ? groupe : { ...groupe, lieux: groupe.lieux.filter(verifierLieu) }))
    .filter((groupe) => groupe.lieux.length > 0);
}
