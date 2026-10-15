export function ecrireNombrePersonnes(personnes: number): string {
  return `${personnes}\u00a0personne${personnes > 1 ? "s" : ""}`;
}
