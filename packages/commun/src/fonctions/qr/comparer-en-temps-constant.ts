/**
 * Compare deux textes sans s'arrêter au premier caractère différent (autant que JavaScript le permet), pour ne pas
 * laisser deviner une signature morceau par morceau en mesurant le temps de réponse.
 */
export function comparerEnTempsConstant(a: string, b: string): boolean {
  const longueur = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let i = 0; i < longueur; i++) {
    difference |= (i < a.length ? a.charCodeAt(i) : 0) ^ (i < b.length ? b.charCodeAt(i) : 0);
  }
  return difference === 0;
}
