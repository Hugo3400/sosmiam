import { calculerDecalageParis } from "./calculer-decalage-paris.ts";
import { calculerInstantParis } from "./calculer-instant-paris.ts";

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/**
 * Instant (millisecondes UTC) du début du mois en cours à l'heure de Paris : le 1er à minuit. Sert au classement du mois
 * entre potes. Sans Intl, comme calculerDecalageParis : même résultat sur le téléphone, dans les tests et sur le serveur.
 * Exemple : le 31 octobre 2026 à 23 h 30 UTC, il est déjà 0 h 30 le 1er novembre à Paris : le mois commence le
 * 31 octobre à 23 h UTC.
 */
export function calculerDebutMoisParis(instantMs: number): number {
  // Le jour qu'il est à Paris, lu comme s'il était en UTC
  const aParis = new Date(instantMs + calculerDecalageParis(instantMs));
  return calculerInstantParis(`${aParis.getUTCFullYear()}-${deuxChiffres(aParis.getUTCMonth() + 1)}-01`, "00:00");
}
