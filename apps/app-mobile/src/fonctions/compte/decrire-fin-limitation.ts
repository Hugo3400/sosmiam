import { ecrireMomentLong } from "~/fonctions/dates/ecrire-moment-long";

/**
 * La fin d'une limitation du compte en mots : « jusqu'au 22 octobre 2026 à 12h », ou « jusqu'à nouvel ordre » (fin null,
 * absente ou illisible). Comme decrireFinLimitation du site, à l'heure du téléphone.
 */
export function decrireFinLimitation(fin: string | null | undefined): string {
  const moment = ecrireMomentLong(fin);
  return moment ? `jusqu'au ${moment}` : "jusqu'à nouvel ordre";
}
