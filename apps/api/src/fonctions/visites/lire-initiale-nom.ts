import type { ChiffrementDonnees } from "../../services/chiffrement-donnees.ts";

/** L'initiale du nom, montrée au comptoir (« Léa M. ») ; null sans nom, sans clé, ou s'il ne se lit pas. */
export function lireInitialeNom(nomChiffre: string | null, chiffrement: ChiffrementDonnees | null): string | null {
  if (nomChiffre === null || !chiffrement) return null;
  try {
    const initiale = chiffrement.dechiffrer(nomChiffre, "nom").trim().charAt(0).toLocaleUpperCase("fr-FR");
    return initiale === "" ? null : initiale;
  } catch {
    return null;
  }
}
