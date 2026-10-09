// Ménage de nuit des comptes, d'après les durées décidées le 8 octobre 2026 (politique de confidentialité). Il passe
// AVANT la sauvegarde chiffrée de la nuit : ce qui est effacé ici n'y part pas.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { reculerDeMois } from "../fonctions/dates/reculer-de-mois.ts";
import { retirerDuProgramme } from "./gestion/ambassadeurs.ts";

const UN_JOUR = 86_400_000;
/** Sessions : fermées après 30 jours sans visite, et au plus tard après 90 jours (comme middlewares/proteger-comptes.ts) */
const SESSION_INACTIVE = 30 * UN_JOUR;
const SESSION_MAX = 90 * UN_JOUR;
/** Compte refusé par l'équipe : effacé 30 jours après le refus (le compte n'a servi qu'à cette inscription ; quand l'app aura
 * ses comptes, on ne retirera plus que le rôle) */
const GARDE_REFUS = 30 * UN_JOUR;
/** 1 an sans visite : seulement le rôle ambassadeur est retiré (un mail et le logiciel de gestion préviennent 30 jours avant) */
const INACTIVITE_ROLE = 365 * UN_JOUR;
/** 2 ans sans connexion : tout le compte est effacé, app comprise (un mail prévient 30 jours avant) */
const INACTIVITE_COMPTE = 730 * UN_JOUR;
/** Candidature fondateur ou « ambassadeur certifié » refusée : effacée 3 mois après la réponse */
const MOIS_CANDIDATURE_REFUSEE = 3;

/** Nombre de lignes effacées ou vidées par catégorie (rien de personnel : de quoi tenir le journal) */
export type BilanMenageComptes = {
  sessions: number; comptesRefuses: number; ambassadeursRetires: number; comptesInactifs: number; candidatures: number;
  /** Candidatures « ambassadeur certifié » refusées depuis plus de 3 mois */
  candidaturesCertification: number;
  liens: number;
};

/**
 * Efface ce qui a dépassé sa durée de conservation (décision de Hugo du 8 octobre 2026) : sessions, comptes refusés, rôle
 * ambassadeur après 1 an sans visite, compte après 2 ans sans connexion, candidatures refusées (fondateur et certifié),
 * liens de réinitialisation.
 */
export async function faireLeMenageDesComptes(maintenant = new Date()): Promise<BilanMenageComptes> {
  const avant = (duree: number) => new Date(maintenant.getTime() - duree);
  const limiteCandidatures = reculerDeMois(maintenant, MOIS_CANDIDATURE_REFUSEE);

  const sessions = await baseDeDonnees.sessionCompte.deleteMany({
    where: { OR: [{ activite: { lt: avant(SESSION_INACTIVE) } }, { creeLe: { lt: avant(SESSION_MAX) } }] },
  });
  // Un compte effacé emporte avec lui (en cascade) son ambassadeur, ses sessions, badges, points, candidatures, missions,
  // messages et lectures ; ses propositions de lieux restent, sans lien vers lui
  const comptesRefuses = await baseDeDonnees.compte.deleteMany({
    where: { ambassadeur: { is: { statut: "refuse", decideLe: { lt: avant(GARDE_REFUS) } } } },
  });
  // 1 an sans visite : on retire seulement le rôle (comme « Retirer du programme » dans le logiciel : ligne Ambassadeur,
  // missions, messages perso et candidatures) ; le compte, ses points et ses badges restent
  const aRetirer = await baseDeDonnees.compte.findMany({
    where: { derniereConnexion: { lt: avant(INACTIVITE_ROLE) }, ambassadeur: { isNot: null } },
    select: { id: true },
  });
  let ambassadeursRetires = 0;
  for (const { id } of aRetirer) if (await retirerDuProgramme(id)) ambassadeursRetires += 1;
  // 2 ans sans connexion : tout le compte est effacé
  const comptesInactifs = await baseDeDonnees.compte.deleteMany({ where: { derniereConnexion: { lt: avant(INACTIVITE_COMPTE) } } });
  const candidatures = await baseDeDonnees.candidatureFondateur.deleteMany({ where: { statut: "refusee", reponduLe: { lt: limiteCandidatures } } });
  const candidaturesCertification = await baseDeDonnees.candidatureCertification.deleteMany({
    where: { statut: "refusee", reponduLe: { lt: limiteCandidatures } },
  });
  const liens = await baseDeDonnees.compte.updateMany({
    where: { jetonExpireLe: { lt: maintenant } },
    data: { jetonReinitialisation: null, jetonExpireLe: null },
  });
  return {
    sessions: sessions.count,
    comptesRefuses: comptesRefuses.count,
    ambassadeursRetires,
    comptesInactifs: comptesInactifs.count,
    candidatures: candidatures.count,
    candidaturesCertification: candidaturesCertification.count,
    liens: liens.count,
  };
}
