import { calculerDecalageParis } from "@sos-miam/commun/fonctions/temps/calculer-decalage-paris";

const MINUTE_MS = 60_000;

export function estTelephoneALHeureDeParis(instantMs: number): boolean {
  return -new Date(instantMs).getTimezoneOffset() * MINUTE_MS === calculerDecalageParis(instantMs);
}
