export function ecrireNombrePersonnes(personnes: number): string {
  return `${personnes} personne${personnes > 1 ? "s" : ""}`;
}
