import { contientMotAlcool } from "../fidelite/contient-mot-alcool.ts";

/**
 * Vrai si un texte parle d'alcool, pour afficher le message sanitaire à côté : un mot d'alcool (MOTS_ALCOOL, comme pour la
 * fidélité, pluriels compris), un « happy hour » ou un « verre » (« Un verre offert »). Large exprès : un message de trop ne
 * gêne personne, un message oublié si. « Verre » reste ici, pas dans MOTS_ALCOOL : « un verre de limonade » n'a pas besoin
 * d'une version sans alcool dans la fidélité.
 */
export function parleDAlcool(texte: string | null | undefined): boolean {
  if (!texte) return false;
  return contientMotAlcool(texte) || /happy[\s-]*hours?/i.test(texte) || /(^|[^\p{L}])verres?([^\p{L}]|$)/iu.test(texte);
}
