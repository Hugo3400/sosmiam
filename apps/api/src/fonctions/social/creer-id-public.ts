// L'identifiant public d'une personne (spécification sociale, « Vocabulaire ») : le seul que l'app et les autres connaissent,
// jamais l'id du compte (les id se suivent : ils diraient combien il y a de comptes, et laisseraient tout parcourir).
/** Minuscules sans l ni o, et chiffres de 2 à 9 : rien qui se confonde à l'œil (1, l, 0, o) ; FORME_ID_PUBLIC de commun */
const ALPHABET_ID_PUBLIC = "abcdefghijkmnpqrstuvwxyz23456789";
const LONGUEUR_ID_PUBLIC = 10;

/** 10 caractères tirés au hasard (`tirer(max)` rend un entier de 0 à max − 1, randomInt de node:crypto en vrai) */
export function creerIdPublic(tirer: (max: number) => number): string {
  let id = "";
  for (let i = 0; i < LONGUEUR_ID_PUBLIC; i++) id += ALPHABET_ID_PUBLIC[tirer(ALPHABET_ID_PUBLIC.length)];
  return id;
}
