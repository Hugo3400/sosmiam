import { MOYENS_AJOUT_EN_VRAI } from "@sos-miam/commun/regles/chat";
import type { Pote } from "@sos-miam/commun/types/potes";

/**
 * Vrai si tu peux discuter avec ce pote : entre adultes, toujours (dans ta bande) ; dès qu'un des deux est mineur,
 * seulement s'il a été ajouté « en vrai » (lien, QR code, ou pote de la démo).
 */
export function peutDiscuter(moi: Pote, pote: Pote, moyenAjout: string | undefined): boolean {
  if (!moi.mineur && !pote.mineur) return true;
  return moyenAjout !== undefined && MOYENS_AJOUT_EN_VRAI.includes(moyenAjout);
}
