import { JOURS_NOUVEAU_DANS_L_APP } from "@sos-miam/commun/regles/sorties-miamis";

const JOUR_MS = 86_400_000;

export function estNouveauDansLApp(creeLe: string | null | undefined, maintenant: Date = new Date()): boolean {
  if (!creeLe) return false;
  const debut = Date.parse(creeLe);
  return !Number.isNaN(debut) && maintenant.getTime() - debut < JOURS_NOUVEAU_DANS_L_APP * JOUR_MS;
}
