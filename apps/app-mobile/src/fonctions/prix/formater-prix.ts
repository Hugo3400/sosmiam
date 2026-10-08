/**
 * Prix à la française, avec une espace insécable avant « € » (le signe ne part jamais seul à la ligne) :
 * 12 → « 12 € », 4.5 → « 4,50 € », 1250 → « 1 250 € ».
 */
export function formaterPrix(prix: number): string {
  const centimes = Math.round(prix * 100);
  const euros = Math.trunc(centimes / 100);
  const reste = Math.abs(centimes % 100);
  // Espace fine insécable entre les milliers, comme le veut la typographie française
  const entier = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${entier}${reste === 0 ? "" : `,${String(reste).padStart(2, "0")}`} €`;
}
