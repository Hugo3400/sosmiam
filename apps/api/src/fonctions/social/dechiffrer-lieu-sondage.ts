import { CONTEXTES_SOCIAUX, type ChiffrementSocial } from "../../services/chiffrement-social.ts";

export function dechiffrerLieuSondage(chiffrement: ChiffrementSocial, lieuChiffre: string, o: { conversationId: number; idClient: string; ordre: number }): number | null {
  try {
    const clair = chiffrement.dechiffrerTexte("textes", CONTEXTES_SOCIAUX.optionSondage(o.conversationId, o.idClient, o.ordre), lieuChiffre);
    return /^[1-9]\d{0,8}$/.test(clair) ? Number(clair) : null;
  } catch {
    return null;
  }
}
