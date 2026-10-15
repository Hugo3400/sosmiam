import type { Lieu } from "@sos-miam/commun/types/lieu";

export function retirerSosFinis(lieux: Lieu[], cleSosFinis: string): Lieu[] {
  if (cleSosFinis === "") return lieux;
  const finis = new Set(cleSosFinis.split(",").map(Number));
  return lieux.map((lieu) => (finis.has(lieu.id) ? { ...lieu, sos: undefined } : lieu));
}
