export function lireCreneauxProposes(r: { creneau: string; creneauxProposes?: readonly string[] }): string[] {
  return r.creneauxProposes && r.creneauxProposes.length > 0 ? [...r.creneauxProposes] : [r.creneau];
}
