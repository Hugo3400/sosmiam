import { lieuxProposes, type Lieu } from "~/contenus/villes";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

/**
 * Retrouve un lieu proposé d'après ce qui a été tapé, sans tenir compte des accents ni des majuscules : « sete » → Sète.
 * Un nom porté par deux villes (Saint-Denis) n'est reconnu que s'il est précisé : « Saint-Denis (La Réunion) ».
 */
export function trouverLieuPropose(saisie: string): Lieu | undefined {
  const cherche = normaliserRecherche(saisie.trim());
  if (!cherche) return undefined;
  const memeValeur = lieuxProposes.find((lieu) => normaliserRecherche(lieu.valeur) === cherche);
  if (memeValeur) return memeValeur;
  const memeNom = lieuxProposes.filter((lieu) => normaliserRecherche(lieu.nom) === cherche);
  return memeNom.length === 1 ? memeNom[0] : undefined;
}
