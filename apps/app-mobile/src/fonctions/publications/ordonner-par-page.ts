export function ordonnerParPage<T>(elements: readonly T[], taille: number, ordonner: (page: T[]) => T[]): T[] {
  const resultat: T[] = [];
  for (let debut = 0; debut < elements.length; debut += taille) resultat.push(...ordonner(elements.slice(debut, debut + taille)));
  return resultat;
}
