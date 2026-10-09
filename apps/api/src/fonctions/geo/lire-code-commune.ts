/** Code INSEE d'une commune ou d'un arrondissement : 5 caractères, « 2A » ou « 2B » au début pour la Corse */
const FORME_CODE_COMMUNE = /^(?:\d{5}|2[AB]\d{3})$/;

/** Le code de commune reçu, sans espaces et en majuscules (« 2a004 » → « 2A004 »), ou null s'il n'en a pas la forme. */
export function lireCodeCommune(valeur: unknown): string | null {
  const code = typeof valeur === "string" ? valeur.trim().toUpperCase() : "";
  return FORME_CODE_COMMUNE.test(code) ? code : null;
}
