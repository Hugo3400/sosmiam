export function ajouterAnnonceVue(vues: readonly number[], id: number, plafond: number): number[] {
  const suite = [...vues.filter((vue) => vue !== id), id];
  return plafond > 0 ? suite.slice(-plafond) : [];
}
