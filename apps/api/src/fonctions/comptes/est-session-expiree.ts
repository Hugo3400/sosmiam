// Durées des sessions des comptes (docs/decisions.md, « Espace ambassadeur » et « L'app parle au serveur »), communes à
// la protection des routes (middlewares/proteger-comptes.ts) et au ménage de nuit (services/menage-comptes.ts).

const UN_JOUR = 86_400_000;

/** « site » : le cookie du site (espace ambassadeur, espace pro) ; « app » : le jeton gardé dans le coffre du téléphone */
export type SupportSession = "site" | "app";

export const DUREES_SESSIONS = {
  /** Site : fermée après 30 jours sans visite, et au plus tard 90 jours après l'ouverture */
  site: { inactiviteMax: 30 * UN_JOUR, dureeMax: 90 * UN_JOUR, ecritureActivite: 5 * 60_000 },
  /** App : 1 an, prolongé à chaque usage (sans limite totale) ; l'activité n'est réécrite qu'au plus une fois par jour */
  app: { inactiviteMax: 365 * UN_JOUR, dureeMax: null, ecritureActivite: UN_JOUR },
} satisfies Record<SupportSession, { inactiviteMax: number; dureeMax: number | null; ecritureActivite: number }>;

/** Vrai si la session a passé sa durée (selon son support) à ce moment. */
export function estSessionExpiree(session: { support: SupportSession; creeLe: number; activite: number }, maintenant: number): boolean {
  const { inactiviteMax, dureeMax } = DUREES_SESSIONS[session.support];
  return maintenant - session.activite > inactiviteMax || (dureeMax !== null && maintenant - session.creeLe > dureeMax);
}
