import { ANCIENNETE_MIN_MASQUAGE_JOURS } from "../../../../../packages/commun/src/regles/signalement.ts";

const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Un signalement « choquant » sur un commentaire, un message ou une liste masque-t-il ce contenu pour tout le monde, en
 * attendant la modération ? Seulement si celui qui signale a un e-mail vérifié et un compte d'au moins 7 jours, et si ce
 * contenu n'a jamais eu de signalement rejeté (garde-fous contre les masquages abusifs, réponse de Hugo du 14/10/2026,
 * I.18 a). Sinon, le signalement passe en tête de la file sans rien masquer.
 */
export function peutMasquerToutDeSuite(signaleur: { emailVerifie: boolean; creeLe: Date }, dejaRejete: boolean, maintenant: Date): boolean {
  if (!signaleur.emailVerifie || dejaRejete) return false;
  return maintenant.getTime() - signaleur.creeLe.getTime() >= ANCIENNETE_MIN_MASQUAGE_JOURS * JOUR_MS;
}
