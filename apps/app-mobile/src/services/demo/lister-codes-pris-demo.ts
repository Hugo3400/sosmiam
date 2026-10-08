import type { MagasinDemo } from "./types-demo";

/**
 * Codes à 4 chiffres en attente chez un lieu (additions demandées et demandes de récompense) : un nouveau code doit
 * en être différent, pour que l'équipe ne confonde jamais deux personnes.
 */
export function listerCodesPrisDemo(m: Readonly<MagasinDemo>, lieuId: number): Set<string> {
  const codes = new Set<string>();
  for (const v of m.visites) if (v.lieuId === lieuId && v.statut === "demandee" && v.code) codes.add(v.code);
  for (const c of m.cartes) if (c.lieuId === lieuId && c.demande) codes.add(c.demande.code);
  return codes;
}
