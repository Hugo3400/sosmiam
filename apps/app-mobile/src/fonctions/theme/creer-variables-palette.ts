export function creerVariablesPalette(palette: Readonly<Record<string, string>>): Record<`--couleur-${string}`, string> {
  return Object.fromEntries(
    Object.entries(palette).map(([nom, hex]) => {
      const n = Number.parseInt(hex.slice(1), 16);
      return [`--couleur-${nom}`, `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`];
    }),
  ) as Record<`--couleur-${string}`, string>;
}
