import type { FiltresDefi } from "../../../../../packages/commun/src/types/defi.ts";
import type { TypeLieu } from "../../../../../packages/commun/src/types/lieu.ts";

const TYPES_LIEU: readonly string[] = ["resto", "patisserie", "bar", "sortie"];

/**
 * Les filtres d'un défi tels que la base les garde (colonne JSON, écrite par validerDefi ou par la migration des défis de
 * départ), relus avec prudence : seuls les filtres connus et bien formés sont gardés ; null s'il n'en reste aucun.
 */
export function lireFiltresEnBase(brut: unknown): FiltresDefi | null {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return null;
  const r = brut as Record<string, unknown>;
  const filtres: FiltresDefi = {};
  if (Array.isArray(r.typesLieu)) {
    const types = r.typesLieu.filter((type): type is TypeLieu => typeof type === "string" && TYPES_LIEU.includes(type));
    if (types.length > 0) filtres.typesLieu = types;
  }
  if (typeof r.apresHeure === "number" && Number.isInteger(r.apresHeure) && r.apresHeure >= 0 && r.apresHeure <= 23) filtres.apresHeure = r.apresHeure;
  if (r.pendantSos === true) filtres.pendantSos = true;
  if (r.avecPhoto === true) filtres.avecPhoto = true;
  return Object.keys(filtres).length > 0 ? filtres : null;
}
