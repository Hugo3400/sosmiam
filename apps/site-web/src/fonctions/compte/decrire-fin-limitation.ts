import { formaterMomentAParis } from "../dates/formater-moment-a-paris.ts";

/** La fin d'une limitation en mots : « jusqu'au 22 octobre 2026 à 12 h », ou « jusqu'à nouvel ordre » (fin null ou illisible). */
export function decrireFinLimitation(fin: string | null | undefined): string {
  const moment = fin ? formaterMomentAParis(fin) : null;
  return moment ? `jusqu'au ${moment}` : "jusqu'à nouvel ordre";
}
