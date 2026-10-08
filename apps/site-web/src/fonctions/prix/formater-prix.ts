const formatEuros = (decimales: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

/** Affiche un prix à la française : 0 → « 0 € », 10.99 → « 10,99 € » (espace insécable avant €). */
export function formaterPrix(montant: number): string {
  const decimales = Number.isInteger(montant) ? 0 : 2;
  return formatEuros(decimales).format(montant);
}
