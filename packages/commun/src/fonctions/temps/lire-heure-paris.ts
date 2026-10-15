import { calculerDecalageParis } from "./calculer-decalage-paris.ts";
import { ecrireHeureMinutes } from "./ecrire-heure-minutes.ts";

export function lireHeureParis(instantMs: number): string {
  const aParis = new Date(instantMs + calculerDecalageParis(instantMs));
  return ecrireHeureMinutes(aParis.getUTCHours() * 60 + aParis.getUTCMinutes());
}
