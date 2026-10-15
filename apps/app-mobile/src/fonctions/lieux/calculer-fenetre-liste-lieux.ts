const FENETRE_MIN = 5;
const FENETRE_MAX = 21;

export function calculerFenetreListeLieux(hauteurVisible: number, hauteurEnTete: number): number {
  if (!(hauteurVisible > 0)) return FENETRE_MAX;
  const fenetre = Math.ceil((2 * (Math.max(0, hauteurEnTete) + hauteurVisible)) / hauteurVisible);
  return Math.min(FENETRE_MAX, Math.max(FENETRE_MIN, fenetre));
}
