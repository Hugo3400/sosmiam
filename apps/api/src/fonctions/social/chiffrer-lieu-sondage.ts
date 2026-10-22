import { CONTEXTES_SOCIAUX, type ChiffrementSocial } from "../../services/chiffrement-social.ts";

export function chiffrerLieuSondage(chiffrement: ChiffrementSocial, lieuId: number, o: { conversationId: number; idClient: string; ordre: number }): string {
  return chiffrement.chiffrerTexte("textes", CONTEXTES_SOCIAUX.optionSondage(o.conversationId, o.idClient, o.ordre), String(lieuId));
}
