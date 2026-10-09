import { LIBELLES_MOTIF_AVIS_LOUCHE } from "../../contenus/raisons-relecture.ts";
import type { MotifAvisLouche, VerdictRelecture } from "../../types/avis.ts";

/**
 * Le verdict d'un ambassadeur sur un avis à relire, lu dans une demande : { type: "ok" }, { type: "louche", motif } (un
 * motif de la liste fermée, jamais de texte libre) ou { type: "deporte" } (il connaît le lieu ou l'auteur et passe son
 * tour). Rend null pour tout le reste.
 */
export function lireVerdictRelecture(brut: unknown): VerdictRelecture | null {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return null;
  const { type, motif } = brut as Record<string, unknown>;
  if (type === "ok" || type === "deporte") return { type };
  if (type === "louche" && typeof motif === "string" && Object.hasOwn(LIBELLES_MOTIF_AVIS_LOUCHE, motif)) return { type, motif: motif as MotifAvisLouche };
  return null;
}
