/**
 * Le prix tapé dans l'éditeur de carte, en euros : « 12 », « 12,50 », « 12.5 », « 1 200 », « 4,50 € » ; un signe moins
 * est lu (« -3 » donne -3, refusé ensuite par la vérification commune). Vide ou illisible : null.
 */
export function lirePrixSaisi(texte: string): number | null {
  const propre = texte.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^-?\d{1,7}(\.\d+)?$/.test(propre)) return null;
  return Number(propre);
}
