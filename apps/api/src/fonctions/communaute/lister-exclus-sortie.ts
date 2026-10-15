export function listerExclusSortie(organisateurId: number, participants: readonly number[], paires: readonly (readonly [number, number])[]): Set<number> {
  const exclus = new Set<number>();
  for (const [a, b] of paires) {
    if (a === organisateurId && b !== organisateurId) exclus.add(b);
    if (b === organisateurId && a !== organisateurId) exclus.add(a);
  }
  return new Set(participants.filter((id) => exclus.has(id)));
}
