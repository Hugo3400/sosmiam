/** Au-delà, c'est sûrement une faute de frappe (un zéro de trop) */
const PRIX_MAXIMUM = 9999;

/**
 * Lit un prix tapé au clavier : « 12 », « 4,50 », « 4.5 », « 12 € » → 12, 4.5, 4.5, 12. Deux chiffres après la virgule au
 * plus, de 0 (gratuit) à 9 999 €. Rend null si ce n'est pas un prix (vide, lettres, négatif, trop de décimales).
 */
export function lireSaisiePrix(texte: string): number | null {
  const nettoye = texte.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(nettoye)) return null;
  const prix = Number(nettoye);
  return prix <= PRIX_MAXIMUM ? prix : null;
}
