import { calculerDecalageParis } from "./calculer-decalage-paris.ts";

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/**
 * Le jour qu'il est à Paris à cet instant (millisecondes UTC), en « AAAA-MM-JJ » : 23 h 30 UTC un 14 octobre, c'est déjà
 * le 15 à Paris. Sans Intl, comme calculerDecalageParis : même résultat sur le téléphone (quel que soit son fuseau), dans
 * les tests et sur le serveur. Ces jours se comparent comme du texte (« 2026-10-14 » < « 2026-11-01 »).
 */
export function calculerJourParis(instantMs: number): string {
  const aParis = new Date(instantMs + calculerDecalageParis(instantMs));
  return `${aParis.getUTCFullYear()}-${deuxChiffres(aParis.getUTCMonth() + 1)}-${deuxChiffres(aParis.getUTCDate())}`;
}
