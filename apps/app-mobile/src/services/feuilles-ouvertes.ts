// Les feuilles (Modal) ouvertes qui savent se refermer puis ouvrir une page, la dernière ouverte au premier plan
// (FeuilleCommentaires et son fermerPuisOuvrir, FeuilleBas et les autres par utiliserInscriptionFeuille). L'annonce d'un
// compte limité s'en sert : « Voir pourquoi » referme d'abord les feuilles (sinon la page s'ouvrirait dessous) et, sur
// Android, où une feuille passe au-dessus de l'annonce, elle attend leur fermeture pour compter ses secondes. En mémoire
// seulement.
import type { Href } from "expo-router";

/** Referme la feuille, puis ouvre la page une fois la feuille partie */
type Ouvreur = (destination: Href) => void;

type Feuille = { ouvrir: Ouvreur; fermer?: () => void };

const feuilles: Feuille[] = [];
const ecouteurs = new Set<() => void>();

function prevenir() {
  for (const ecouteur of [...ecouteurs]) {
    try {
      ecouteur();
    } catch {
      // Une erreur chez l'un ne gêne ni les autres ni la feuille
    }
  }
}

/**
 * Une feuille vient de s'ouvrir ; rend de quoi l'oublier quand elle se ferme. `fermer` : la refermer sans rien ouvrir, quand
 * une autre feuille posée dessus (un menu ouvert depuis elle) s'occupe d'ouvrir la page
 */
export function poserFeuilleOuverte(ouvrir: Ouvreur, fermer?: () => void): () => void {
  const feuille: Feuille = { ouvrir, fermer };
  feuilles.push(feuille);
  prevenir();
  return () => {
    const i = feuilles.lastIndexOf(feuille);
    if (i < 0) return;
    feuilles.splice(i, 1);
    prevenir();
  };
}

/**
 * De quoi ouvrir une page par-dessus les feuilles ouvertes : celle du premier plan se referme puis ouvre la page, celles du
 * dessous se referment simplement. null s'il n'y en a pas (la page s'ouvre alors directement)
 */
export function trouverFeuilleOuverte(): Ouvreur | null {
  const dessus = feuilles.at(-1);
  if (!dessus) return null;
  const dessous = feuilles.slice(0, -1);
  return (destination) => {
    dessous.forEach((f) => f.fermer?.());
    dessus.ouvrir(destination);
  };
}

/** Écoute les ouvertures et fermetures des feuilles ; rend de quoi ne plus écouter */
export function ecouterFeuillesOuvertes(ecouteur: () => void): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}
