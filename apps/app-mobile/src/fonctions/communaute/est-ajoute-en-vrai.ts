import { MOYENS_AJOUT_EN_VRAI } from "@sos-miam/commun/regles/chat";

/** Vrai si ce pote a été ajouté « en vrai » (lien, QR code, ou pote de la démo), pas seulement par son pseudo (voir moyenAjout). */
export function estAjouteEnVrai(moyenAjout: string | undefined): boolean {
  return moyenAjout !== undefined && MOYENS_AJOUT_EN_VRAI.includes(moyenAjout);
}
