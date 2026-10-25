export type Position = { latitude: number; longitude: number };

export function arrondirPosition({ latitude, longitude }: Position, decimales: number): Position {
  const facteur = 10 ** decimales;
  return { latitude: Math.round(latitude * facteur) / facteur, longitude: Math.round(longitude * facteur) / facteur };
}
