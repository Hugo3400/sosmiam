export type OccupationSortieMiamis = { places: number; occupees: number; placeGardeePourNouveau: boolean; nouveauDejaLa: boolean };

export function compterPlacesLibres(occupation: OccupationSortieMiamis, pourUnNouveau: boolean): number {
  const libres = Math.max(0, occupation.places - occupation.occupees);
  const gardee = occupation.placeGardeePourNouveau && !occupation.nouveauDejaLa && !pourUnNouveau ? 1 : 0;
  return Math.max(0, libres - gardee);
}
