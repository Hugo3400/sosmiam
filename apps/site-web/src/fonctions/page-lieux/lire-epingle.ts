import type { CategorieLieu, EpingleLieu } from "~/types/lieux";

const TYPES: ReadonlySet<string> = new Set<CategorieLieu>(["resto", "patisserie", "bar", "sortie"]);

const estCoordonnee = (valeur: unknown, limite: number): valeur is number => typeof valeur === "number" && Number.isFinite(valeur) && Math.abs(valeur) <= limite;

export function lireEpingle(brut: unknown): EpingleLieu | null {
  if (typeof brut !== "object" || brut === null) return null;
  const epingle = brut as Record<string, unknown>;
  if (!Number.isSafeInteger(epingle.id) || (epingle.id as number) <= 0 || typeof epingle.nom !== "string") return null;
  if (typeof epingle.type !== "string" || !TYPES.has(epingle.type)) return null;
  if (!estCoordonnee(epingle.latitude, 90) || !estCoordonnee(epingle.longitude, 180)) return null;
  return {
    id: epingle.id as number,
    nom: epingle.nom,
    type: epingle.type as CategorieLieu,
    latitude: epingle.latitude,
    longitude: epingle.longitude,
    sos: epingle.sos === true,
  };
}
