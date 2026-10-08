const format = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

/** Nombre court pour les axes et les tuiles : 980, 12,9 k, 4,2 M. */
export function formaterNombreCourt(nombre: number): string {
  return format.format(nombre).replace(/\s?k$/, " k").replace(/\s?M$/, " M");
}
