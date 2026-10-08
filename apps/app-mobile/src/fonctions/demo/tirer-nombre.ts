type SourceHasard = { getRandomValues?: (tableau: Uint32Array) => Uint32Array };

const PLAGE = 2 ** 32;

/**
 * Tire un entier au hasard entre 0 (compris) et max (non compris). Prend le hasard du système quand il est là ;
 * sinon Math.random (suffisant pour la démo, comme creerCodeInvitation : l'API tirera les vrais codes).
 */
export function tirerNombre(max: number): number {
  const borne = Math.floor(max);
  if (!(borne > 1)) return 0;
  const hasard = (globalThis as { crypto?: SourceHasard }).crypto;
  if (typeof hasard?.getRandomValues !== "function" || borne > PLAGE) return Math.floor(Math.random() * borne);
  // On écarte le haut de la plage qui ne tombe pas juste : chaque valeur a la même chance de sortir
  const limite = PLAGE - (PLAGE % borne);
  const tableau = new Uint32Array(1);
  for (let essai = 0; essai < 20; essai++) {
    hasard.getRandomValues(tableau);
    if (tableau[0] < limite) return tableau[0] % borne;
  }
  return Math.floor(Math.random() * borne);
}
