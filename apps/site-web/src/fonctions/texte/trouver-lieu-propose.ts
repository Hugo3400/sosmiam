import { lieuxProposes, type LieuPropose } from "~/contenus/villes";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

/** Retrouve un lieu proposé d'après ce qui a été tapé, sans tenir compte des accents ni des majuscules : « sete » → Sète. */
export function trouverLieuPropose(saisie: string): LieuPropose | undefined {
  const cherche = normaliserRecherche(saisie.trim());
  return cherche ? lieuxProposes.find((lieu) => normaliserRecherche(lieu.nom) === cherche) : undefined;
}
