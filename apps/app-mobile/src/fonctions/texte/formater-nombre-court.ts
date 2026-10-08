/** Compteur court à la française : 948 → « 948 », 1 234 → « 1,2 k », 12 500 → « 12 k ». */
export function formaterNombreCourt(nombre: number): string {
  if (nombre < 1000) return String(nombre);
  const milliers = nombre / 1000;
  return `${milliers < 10 ? milliers.toFixed(1).replace(".", ",").replace(",0", "") : Math.round(milliers)} k`;
}
