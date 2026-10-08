import { lieuxProposes, type Lieu } from "~/contenus/villes";
import { simplifierRecherche } from "~/fonctions/texte/simplifier-recherche";

/**
 * Retrouve un lieu proposé d'après ce qui a été tapé, sans tenir compte des accents, des majuscules, des tirets
 * ni des apostrophes : « sete » → Sète, « ile de france » → Île-de-France, « PACA » → Provence-Alpes-Côte d'Azur.
 * Un nom porté par deux villes (Saint-Denis) n'est pas rattaché à une région s'il n'est pas précisé : on garde alors
 * le nom seul, et sa préposition si elle est la même partout (« à Saint-Denis »).
 */
export function trouverLieuPropose(saisie: string): Lieu | undefined {
  const cherche = simplifierRecherche(saisie);
  if (!cherche) return undefined;
  const memeValeur = lieuxProposes.find((lieu) => [lieu.valeur, ...lieu.alias].some((texte) => simplifierRecherche(texte) === cherche));
  if (memeValeur) return memeValeur;
  const memeNom = lieuxProposes.filter((lieu) => simplifierRecherche(lieu.nom) === cherche);
  if (memeNom.length === 1) return memeNom[0];
  if (memeNom.length > 1 && memeNom.every((lieu) => lieu.ou === memeNom[0].ou)) return { ...memeNom[0], valeur: memeNom[0].nom };
  return undefined;
}
