import type { AuteurActus } from "../../../../../packages/commun/src/types/actus.ts";

export function lireAuteurActus(brut: unknown): AuteurActus | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { id, prenom, avatar, ambassadeur } = brut as Record<string, unknown>;
  if (typeof prenom !== "string" || !prenom.trim()) return null;
  return {
    id: Number.isSafeInteger(id) ? (id as number) : 0,
    prenom: prenom.trim(),
    avatar: typeof avatar === "string" && avatar.trim() ? avatar.trim() : null,
    ambassadeur: ambassadeur === true,
  };
}
