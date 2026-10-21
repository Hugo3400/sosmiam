export type ChampReglages = { service: number | null; champ: string };

const CHAMP_SERVICE = /^services\.(\d+)(?:\.(.+))?$/;

export function lireChampReglages(champ: string): ChampReglages {
  const morceaux = CHAMP_SERVICE.exec(champ);
  if (morceaux) return { service: Number(morceaux[1]), champ: morceaux[2] ?? "autre" };
  return { service: null, champ };
}
