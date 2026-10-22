export const SEUIL_SON_MICRO = 0.2;
export const DUREE_SILENCE_MICRO_MS = 3000;

export function suivreSilenceMicro(dernierSonMs: number, niveau: number | null, maintenantMs: number): { dernierSonMs: number; silencieux: boolean } {
  if (niveau === null) return { dernierSonMs: maintenantMs, silencieux: false };
  const entendu = niveau >= SEUIL_SON_MICRO ? maintenantMs : dernierSonMs;
  return { dernierSonMs: entendu, silencieux: maintenantMs - entendu >= DUREE_SILENCE_MICRO_MS };
}
