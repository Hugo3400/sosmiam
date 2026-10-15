// Les feuilles (Modal) ouvertes qui savent se refermer puis ouvrir une page, la dernière ouverte au premier plan
// (FeuilleCommentaires et son fermerPuisOuvrir). L'annonce d'un compte limité, posée au-dessus de tout, s'en sert pour
// « Voir pourquoi » : sans ça, la page s'ouvrirait sous la feuille restée ouverte. En mémoire seulement.
import type { Href } from "expo-router";

/** Referme la feuille, puis ouvre la page une fois la feuille partie */
type Ouvreur = (destination: Href) => void;

const ouvreurs: Ouvreur[] = [];

/** Une feuille vient de s'ouvrir ; rend de quoi l'oublier quand elle se ferme */
export function poserFeuilleOuverte(ouvreur: Ouvreur): () => void {
  ouvreurs.push(ouvreur);
  return () => {
    const i = ouvreurs.lastIndexOf(ouvreur);
    if (i >= 0) ouvreurs.splice(i, 1);
  };
}

/** La feuille au premier plan, ou null s'il n'y en a pas (la page s'ouvre alors directement) */
export function trouverFeuilleOuverte(): Ouvreur | null {
  return ouvreurs.at(-1) ?? null;
}
