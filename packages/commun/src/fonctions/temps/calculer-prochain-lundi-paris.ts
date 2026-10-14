import { calculerDecalageParis } from "./calculer-decalage-paris.ts";
import { calculerInstantParis } from "./calculer-instant-paris.ts";

const JOUR_MS = 24 * 60 * 60_000;
const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/**
 * Instant (millisecondes UTC) du prochain lundi 00:00 à l'heure de Paris, strictement après cet instant : la recharge des
 * rescousses. Pile le lundi à minuit, c'est le lundi suivant (la recharge vient d'avoir lieu). Sans Intl, comme
 * calculerDecalageParis : même résultat sur le téléphone (quel que soit son fuseau), dans les tests et sur le serveur.
 */
export function calculerProchainLundiParis(instantMs: number): number {
  // Le jour et l'heure qu'il est à Paris, lus comme s'ils étaient en UTC
  const aParis = new Date(instantMs + calculerDecalageParis(instantMs));
  // 0 = dimanche (lundi demain), 1 = lundi (le suivant, dans 7 jours)…
  const joursAvantLundi = (8 - aParis.getUTCDay()) % 7 || 7;
  const lundi = new Date(Date.UTC(aParis.getUTCFullYear(), aParis.getUTCMonth(), aParis.getUTCDate()) + joursAvantLundi * JOUR_MS);
  const jour = `${lundi.getUTCFullYear()}-${deuxChiffres(lundi.getUTCMonth() + 1)}-${deuxChiffres(lundi.getUTCDate())}`;
  return calculerInstantParis(jour, "00:00");
}
