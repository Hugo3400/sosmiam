/** Délais avant de réessayer un mail raté : 5 min, 30 min, 2 h, 6 h, puis 24 h. Au-delà, on abandonne. */
const DELAIS_MINUTES = [5, 30, 120, 360, 1440];

/** Date du prochain essai après `essais` échecs, ou null s'il faut abandonner. */
export function calculerProchainEssai(essais: number, maintenant: Date): Date | null {
  const delai = DELAIS_MINUTES[essais - 1];
  return delai === undefined ? null : new Date(maintenant.getTime() + delai * 60_000);
}
