import type { Lieu } from "../../types/lieu.ts";

/**
 * Vrai si le lieu a un compte SOS Miam (« vérifié ✓ »). Sans compte, pas de visite validée, de SOS, de points de visite
 * ni de rescousse comptée (décidé le 9 octobre 2026). Dans le doute (champ absent), on le dit « non vérifié ».
 */
export function estLieuVerifie(lieu: Pick<Lieu, "verifie">): boolean {
  return lieu.verifie === true;
}
