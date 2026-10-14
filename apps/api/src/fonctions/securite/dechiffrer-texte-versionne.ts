import { dechiffrerDonnee } from "./dechiffrer-donnee.ts";
import { lireVersionChiffre } from "./lire-version-chiffre.ts";

/**
 * Relit un texte écrit par chiffrerTexteVersionne (« v<version>:iv:tag:donnees ») : la version écrite en tête choisit la
 * sous-clé (`trouverCle`, null si cette version de clé n'est plus là), et SEULEMENT celle-là. Contrairement à
 * ChiffrementDonnees.dechiffrer, on n'essaie pas les autres clés : une version retouchée ne se lit pas. Lève une erreur,
 * sans jamais citer la valeur, si le format est inconnu, la clé de cette version absente, le contexte faux ou la donnée
 * retouchée.
 */
export function dechiffrerTexteVersionne(chiffre: string, trouverCle: (version: number) => Uint8Array | null, contexte: string): string {
  if (!contexte) throw new Error("Un texte chiffré a besoin d'un contexte");
  const version = lireVersionChiffre(chiffre);
  if (version === null) throw new Error("Donnée chiffrée illisible (format inconnu)");
  const cle = trouverCle(version);
  if (!cle) throw new Error(`Donnée chiffrée illisible (clé de la version ${version} absente)`);
  return dechiffrerDonnee(chiffre, cle, contexte);
}
