import { MAX_DUREE_SONDAGE_JOURS, MAX_LIEUX_SONDAGE, MIN_DUREE_SONDAGE_MINUTES, MIN_LIEUX_SONDAGE } from "../regles/chat.ts";

const MINUTE_MS = 60_000;
const JOUR_MS = 24 * 60 * MINUTE_MS;
const FORME_DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const ID_LIEU_MAX = 999_999_999;

export type ResultatNouveauSondage =
  | { ok: true; sondage: { lieux: number[]; finLe: string } }
  | { ok: false; champ: "lieux" | "finLe" };

export function validerNouveauSondage(s: { lieux?: unknown; finLe?: unknown }, maintenant: Date): ResultatNouveauSondage {
  const lieux = s.lieux;
  if (
    !Array.isArray(lieux) ||
    lieux.length < MIN_LIEUX_SONDAGE ||
    lieux.length > MAX_LIEUX_SONDAGE ||
    !lieux.every((id) => Number.isInteger(id) && id >= 1 && id <= ID_LIEU_MAX) ||
    new Set(lieux).size !== lieux.length
  ) {
    return { ok: false, champ: "lieux" };
  }
  const brut = s.finLe;
  const finLe = typeof brut === "string" && FORME_DATE_ISO.test(brut) ? Date.parse(brut) : Number.NaN;
  const debut = maintenant.getTime();
  if (Number.isNaN(finLe) || finLe < debut + MIN_DUREE_SONDAGE_MINUTES * MINUTE_MS || finLe > debut + MAX_DUREE_SONDAGE_JOURS * JOUR_MS) {
    return { ok: false, champ: "finLe" };
  }
  return { ok: true, sondage: { lieux: [...(lieux as number[])], finLe: new Date(finLe).toISOString() } };
}
