const VERSION = /^v([1-9]\d{0,2}):/;

/**
 * La version de la clé d'une donnée chiffrée par chiffrerDonnee (« v2:iv:tag:donnees » → 2). Les chiffrés écrits avant
 * le changement de clé portent « v1 » : la toute première clé. Null si la valeur n'a pas ce début.
 */
export function lireVersionChiffre(chiffre: string): number | null {
  const trouve = VERSION.exec(chiffre);
  return trouve ? Number(trouve[1]) : null;
}
