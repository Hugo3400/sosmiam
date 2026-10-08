/**
 * Première étape du filtre de mots interdits : minuscules, sans accents, ligatures dépliées (« Bœuf » → « boeuf »).
 * La ponctuation reste : chaque étape suivante décide quoi en faire.
 */
export function simplifierTexteFiltre(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss");
}
