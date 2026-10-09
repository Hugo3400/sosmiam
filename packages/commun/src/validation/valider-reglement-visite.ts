import { REDUCTIONS_POURCENT } from "../regles/visites.ts";
import type { AvantageVisite, ReglementVisite, TypeReglement } from "../types/visite.ts";

const TYPES: readonly TypeReglement[] = ["paye", "reduction", "offert"];
const AVANTAGES: readonly AvantageVisite[] = ["recompense-fidelite", "happy-hour", "offre-sos", "partenariat", "autre"];

/**
 * Vérifie le règlement choisi par l'équipe en validant (le serveur ne fait jamais confiance au téléphone) : rend le
 * règlement nettoyé (avantages sans doublon, pourcentage seulement pour une réduction), ou null s'il est invalide.
 * Sans règlement du tout : payée, la seule façon de valider jusqu'au 9 octobre 2026.
 */
export function validerReglementVisite(r: unknown): ReglementVisite | null {
  if (r === undefined || r === null) return { type: "paye", reductionPourcent: null, avantages: [] };
  if (typeof r !== "object" || Array.isArray(r)) return null;
  const { type, reductionPourcent, avantages } = r as Record<string, unknown>;
  if (typeof type !== "string" || !TYPES.includes(type as TypeReglement)) return null;

  let pourcent: number | null = null;
  if (type === "reduction" && reductionPourcent !== null && reductionPourcent !== undefined) {
    if (typeof reductionPourcent !== "number" || !REDUCTIONS_POURCENT.includes(reductionPourcent)) return null;
    pourcent = reductionPourcent;
  }

  if (avantages !== undefined && !Array.isArray(avantages)) return null;
  const liste: unknown[] = avantages ?? [];
  if (liste.some((a) => typeof a !== "string" || !AVANTAGES.includes(a as AvantageVisite))) return null;
  return { type: type as TypeReglement, reductionPourcent: pourcent, avantages: [...new Set(liste as AvantageVisite[])] };
}
