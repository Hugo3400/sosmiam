import type { VilleLieux } from "~/types/lieux";

export function lireVilleLieux(brut: unknown): VilleLieux | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { ville, nombre } = brut as { ville?: unknown; nombre?: unknown };
  if (typeof ville !== "string" || !ville.trim() || !Number.isSafeInteger(nombre) || (nombre as number) < 0) return null;
  return { ville: ville.trim(), nombre: nombre as number };
}
