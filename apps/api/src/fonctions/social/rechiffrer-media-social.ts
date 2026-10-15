import type { ChiffrementSocial } from "../../services/chiffrement-social.ts";

/**
 * Changement de clé (étape 9 du ménage) : une photo ou une note vocale chiffrée avec une ANCIENNE version de la clé, relue
 * sous son nom (`ancien`, le contexte « fichier:<nom> ») puis rechiffrée avec la clé courante sous un NOUVEAU nom (un
 * fichier n'est jamais écrasé : l'appelant écrit le nouveau, met la base à jour, puis supprime l'ancien). null : déjà à la
 * clé courante. Lève une erreur si le fichier ne se relit pas.
 */
export function rechiffrerMediaSocial(social: ChiffrementSocial, chiffre: Uint8Array, ancien: string, nouveau: string): Buffer | null {
  if (!social.estAncienOctets(chiffre)) return null;
  return social.chiffrerOctets(social.dechiffrerOctets(chiffre, ancien), nouveau);
}
