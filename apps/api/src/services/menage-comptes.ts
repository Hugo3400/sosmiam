// Ménage de nuit des comptes, d'après les durées décidées le 8 octobre 2026 (politique de confidentialité). Il passe
// AVANT la sauvegarde chiffrée de la nuit : ce qui est effacé ici n'y part pas.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

const UN_JOUR = 86_400_000;
/** Sessions : fermées après 30 jours sans visite, et au plus tard après 90 jours (comme middlewares/proteger-comptes.ts) */
const SESSION_INACTIVE = 30 * UN_JOUR;
const SESSION_MAX = 90 * UN_JOUR;
/** Compte refusé par l'équipe : effacé 30 jours après le refus */
const GARDE_REFUS = 30 * UN_JOUR;
/** Compte sans visite connectée depuis 1 an : effacé (le logiciel de gestion prévient 30 jours avant) */
const INACTIVITE_MAX = 365 * UN_JOUR;
/** Candidature fondateur refusée : effacée 3 mois après la réponse */
const MOIS_CANDIDATURE_REFUSEE = 3;

/** Nombre de lignes effacées ou vidées par catégorie (rien de personnel : de quoi tenir le journal) */
export type BilanMenageComptes = { sessions: number; comptesRefuses: number; comptesInactifs: number; candidatures: number; liens: number };

/** Efface ce qui a dépassé sa durée de conservation : sessions, comptes, candidatures refusées, liens de réinitialisation. */
export async function faireLeMenageDesComptes(maintenant = new Date()): Promise<BilanMenageComptes> {
  const avant = (duree: number) => new Date(maintenant.getTime() - duree);
  const limiteCandidatures = new Date(maintenant);
  limiteCandidatures.setMonth(limiteCandidatures.getMonth() - MOIS_CANDIDATURE_REFUSEE);

  const sessions = await baseDeDonnees.sessionCompte.deleteMany({
    where: { OR: [{ activite: { lt: avant(SESSION_INACTIVE) } }, { creeLe: { lt: avant(SESSION_MAX) } }] },
  });
  // Un compte effacé emporte avec lui (en cascade) son ambassadeur, ses sessions, badges, points, candidatures, missions,
  // messages et lectures ; ses propositions de lieux restent, sans lien vers lui
  const comptesRefuses = await baseDeDonnees.compte.deleteMany({
    where: { ambassadeur: { is: { statut: "refuse", decideLe: { lt: avant(GARDE_REFUS) } } } },
  });
  const comptesInactifs = await baseDeDonnees.compte.deleteMany({ where: { derniereConnexion: { lt: avant(INACTIVITE_MAX) } } });
  const candidatures = await baseDeDonnees.candidatureFondateur.deleteMany({ where: { statut: "refusee", reponduLe: { lt: limiteCandidatures } } });
  const liens = await baseDeDonnees.compte.updateMany({
    where: { jetonExpireLe: { lt: maintenant } },
    data: { jetonReinitialisation: null, jetonExpireLe: null },
  });
  return {
    sessions: sessions.count,
    comptesRefuses: comptesRefuses.count,
    comptesInactifs: comptesInactifs.count,
    candidatures: candidatures.count,
    liens: liens.count,
  };
}
