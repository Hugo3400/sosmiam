import { estPseudoValide } from "../../../../../packages/commun/src/validation/est-pseudo-valide.ts";

/**
 * Le pseudo d'une adresse /invitation/:pseudo, en minuscules et sans « @ » devant (comme l'API le range), s'il a la forme
 * des pseudos (estPseudoValide de packages/commun, la règle de l'API) ; null sinon.
 */
export function lirePseudoInvitation(brut: string | undefined): string | null {
  const pseudo = (brut ?? "").trim().replace(/^@/, "").toLowerCase();
  return estPseudoValide(pseudo) ? pseudo : null;
}
