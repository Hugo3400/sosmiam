import { contientMotAlcool } from "../fidelite/contient-mot-alcool.ts";

/**
 * Vrai si un texte parle d'alcool, pour afficher le message sanitaire à côté : un mot d'alcool (MOTS_ALCOOL, comme pour la
 * fidélité) ou un « happy hour ». Large exprès : un message de trop ne gêne personne, un message oublié si.
 */
export function parleDAlcool(texte: string | null | undefined): boolean {
  if (!texte) return false;
  return contientMotAlcool(texte) || /happy[\s-]*hours?/i.test(texte);
}
