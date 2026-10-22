const NIVEAUX_ONDE = 48;
const PLAFOND_MIN = 0.35;

export function calculerOndeVocal(niveaux: readonly number[]): string | null {
  const propres = niveaux.filter((n) => Number.isFinite(n)).map((n) => Math.min(1, Math.max(0, n)));
  if (propres.length === 0) return null;
  const plafond = Math.max(PLAFOND_MIN, ...propres);
  let onde = "";
  for (let i = 0; i < NIVEAUX_ONDE; i += 1) {
    const debut = Math.floor((i * propres.length) / NIVEAUX_ONDE);
    const fin = Math.max(debut + 1, Math.floor(((i + 1) * propres.length) / NIVEAUX_ONDE));
    const pic = Math.max(...propres.slice(debut, fin));
    onde += String(Math.min(9, Math.round((pic / plafond) * 9)));
  }
  return onde;
}
