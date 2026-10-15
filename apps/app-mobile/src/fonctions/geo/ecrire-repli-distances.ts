export function ecrireRepliDistances(depuisVille: string | null): string | null {
  return depuisVille ? `les distances repartent ${depuisVille}` : null;
}
