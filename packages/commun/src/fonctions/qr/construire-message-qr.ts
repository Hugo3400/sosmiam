import type { JetonComptoir } from "../../types/code-scanne.ts";

/** Le message signé d'un QR du comptoir : « comptoir|<version>|<lieuId>|<presentationId>|<fenetre> » (nombres en décimal). */
export function construireMessageQr(j: Omit<JetonComptoir, "mac">): string {
  return `comptoir|${j.version}|${j.lieuId}|${j.presentationId}|${j.fenetre}`;
}
