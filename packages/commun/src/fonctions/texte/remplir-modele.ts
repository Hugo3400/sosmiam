const ACCOLADES = /\{([a-zA-Z]+)\}/g;

/**
 * Remplace les valeurs entre accolades d'un texte partagé (« {lieu} », « {distance} », « {precision} », « {date} »…).
 * Une valeur absente laisse l'accolade telle quelle, pour qu'un oubli se voie. Les « $ » des valeurs restent tels quels.
 */
export function remplirModele(modele: string, valeurs: Readonly<Record<string, string>>): string {
  return modele.replace(ACCOLADES, (accolade, cle: string) => (Object.prototype.hasOwnProperty.call(valeurs, cle) ? valeurs[cle] : accolade));
}
