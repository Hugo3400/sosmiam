import type { VilleActus } from "../../types/actus.ts";
import { ecrireIdentifiantVille } from "../page-lieux/ecrire-identifiant-ville.ts";

export function lireVilleActus(brut: unknown): VilleActus | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { ville, articles } = brut as { ville?: unknown; articles?: unknown };
  if (typeof ville !== "string" || !ville.trim() || !Number.isSafeInteger(articles) || (articles as number) < 1) return null;
  const identifiant = ecrireIdentifiantVille(ville);
  return identifiant ? { identifiant, nom: ville.trim() } : null;
}
