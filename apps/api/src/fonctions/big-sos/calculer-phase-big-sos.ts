export type PhaseBigSos = "demande" | "verification" | "vote" | "programme" | "a-la-une" | "a-cloturer" | "termine" | "refuse";

/**
 * Où en est un BIG SOS. Une fois validé, ce sont ses dates qui décident : programmé avant le début, à la une pendant
 * les 7 jours, puis « à clôturer » jusqu'à ce que le bilan soit écrit.
 */
export function calculerPhaseBigSos(bigSos: { statut: string; debutLe: Date | null; finLe: Date | null }, maintenant = new Date()): PhaseBigSos {
  if (bigSos.statut !== "valide") return bigSos.statut as PhaseBigSos;
  if (!bigSos.debutLe || maintenant < bigSos.debutLe) return "programme";
  if (!bigSos.finLe || maintenant < bigSos.finLe) return "a-la-une";
  return "a-cloturer";
}
