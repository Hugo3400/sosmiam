/**
 * Garde seulement les champs de `nouveau` qui diffèrent de `actuel` (comparés en JSON : les listes comptent, dans
 * l'ordre). « Ma fiche » n'envoie ainsi à l'API que ce qui change vraiment.
 */
export function garderChampsModifies<T extends object>(actuel: Partial<T>, nouveau: T): Partial<T> {
  const modifies: Partial<T> = {};
  for (const cle of Object.keys(nouveau) as (keyof T)[]) {
    if (JSON.stringify(nouveau[cle] ?? null) !== JSON.stringify(actuel[cle] ?? null)) modifies[cle] = nouveau[cle];
  }
  return modifies;
}
