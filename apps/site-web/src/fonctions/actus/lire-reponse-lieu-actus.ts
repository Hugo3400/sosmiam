import type { ReponseLieuActus } from "../../../../../packages/commun/src/types/actus.ts";

export function lireReponseLieuActus(brut: unknown): ReponseLieuActus | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { lieuId, nomLieu, texte, repondueLe, statut } = brut as Record<string, unknown>;
  if (statut !== undefined && statut !== "publie") return null;
  if (!Number.isSafeInteger(lieuId) || typeof nomLieu !== "string" || !nomLieu.trim() || typeof texte !== "string" || !texte.trim()) return null;
  if (typeof repondueLe !== "string" || Number.isNaN(Date.parse(repondueLe))) return null;
  return { lieuId: lieuId as number, nomLieu: nomLieu.trim(), texte: texte.trim(), repondueLe };
}
