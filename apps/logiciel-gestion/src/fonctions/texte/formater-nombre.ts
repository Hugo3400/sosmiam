const format = new Intl.NumberFormat("fr-FR");

/** Nombre lisible à la française : 1 284. */
export function formaterNombre(nombre: number): string {
  return format.format(nombre);
}
