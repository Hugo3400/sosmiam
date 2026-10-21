export function ecrireNombreCouverts(couverts: number): string {
  return `${couverts} couvert${couverts > 1 ? "s" : ""}`;
}
