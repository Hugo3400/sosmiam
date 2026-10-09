// Ménage de nuit des comptes, d'après les durées décidées le 8 octobre 2026 (politique de confidentialité). Il passe
// AVANT la sauvegarde chiffrée de la nuit : ce qui est effacé ici n'y part pas.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { construireFiltreSessionsExpirees } from "../fonctions/comptes/construire-filtre-sessions-expirees.ts";
import { reculerDeMois } from "../fonctions/dates/reculer-de-mois.ts";
import { retirerDuProgramme } from "./gestion/ambassadeurs.ts";
import { GARDE_RATTACHEMENT_CLOS } from "./pro-regles.ts";

const UN_JOUR = 86_400_000;
/** Ambassadeur refusé par l'équipe : seul son RÔLE est retiré 30 jours après le refus ; le compte reste (il sert à l'app,
 * compte unique : décidé le 9 octobre 2026) */
const GARDE_REFUS = 30 * UN_JOUR;
/** 1 an sans visite : seulement le rôle ambassadeur est retiré (un mail et le logiciel de gestion préviennent 30 jours avant) */
const INACTIVITE_ROLE = 365 * UN_JOUR;
/** 2 ans sans connexion : tout le compte est effacé, app comprise (un mail prévient 30 jours avant) */
const INACTIVITE_COMPTE = 730 * UN_JOUR;
/** Candidature fondateur ou « ambassadeur certifié » refusée : effacée 3 mois après la réponse */
const MOIS_CANDIDATURE_REFUSEE = 3;
/** Proposition de modification d'une fiche de lieu : effacée 1 an après la décision de l'équipe (décidé le 9 octobre 2026) */
const GARDE_SUGGESTION = 365 * UN_JOUR;

/** Nombre de lignes effacées ou vidées par catégorie (rien de personnel : de quoi tenir le journal) */
export type BilanMenageComptes = {
  sessions: number;
  /** Ambassadeurs refusés depuis plus de 30 jours : rôle retiré, compte gardé */
  ambassadeursRefuses: number;
  ambassadeursRetires: number; comptesInactifs: number; candidatures: number;
  /** Candidatures « ambassadeur certifié » refusées depuis plus de 3 mois */
  candidaturesCertification: number;
  liens: number;
  /** Propositions de modification de fiche décidées depuis plus d'un an */
  suggestions: number;
  /** Demandes de rattachement à un lieu refusées, ou rattachements retirés, depuis plus d'un an */
  rattachements: number;
};

/**
 * Efface ce qui a dépassé sa durée de conservation (décision de Hugo du 8 octobre 2026) : sessions (selon leur support,
 * site ou app), rôle ambassadeur 30 jours après un refus (le compte reste), rôle ambassadeur après 1 an sans visite, compte après 2 ans sans connexion, candidatures refusées (fondateur et certifié),
 * liens de réinitialisation et de confirmation d'e-mail périmés, propositions de modification de fiche décidées depuis 1 an,
 * rattachements à un lieu refusés ou retirés depuis 1 an (décision du 9 octobre 2026 ; en attente ou validés : gardés).
 */
export async function faireLeMenageDesComptes(maintenant = new Date()): Promise<BilanMenageComptes> {
  const avant = (duree: number) => new Date(maintenant.getTime() - duree);
  const limiteCandidatures = reculerDeMois(maintenant, MOIS_CANDIDATURE_REFUSEE);

  // Mêmes durées que middlewares/proteger-comptes.ts : le site (30 jours sans visite, 90 jours au plus), l'app (1 an sans
  // usage, sans limite totale). Une ancienne ligne sans support connu compte comme « site ».
  const sessions = await baseDeDonnees.sessionCompte.deleteMany({ where: construireFiltreSessionsExpirees(maintenant) });
  // Refusé depuis 30 jours : on retire seulement le rôle (comme « Retirer du programme » : ligne Ambassadeur, missions,
  // messages perso et candidatures) ; le compte, ses points, ses badges et son app restent
  const refuses = await baseDeDonnees.ambassadeur.findMany({
    where: { statut: "refuse", decideLe: { lt: avant(GARDE_REFUS) } },
    select: { compteId: true },
  });
  let ambassadeursRefuses = 0;
  for (const { compteId } of refuses) if (await retirerDuProgramme(compteId)) ambassadeursRefuses += 1;
  // 1 an sans visite : on retire seulement le rôle (comme « Retirer du programme » dans le logiciel : ligne Ambassadeur,
  // missions, messages perso et candidatures) ; le compte, ses points et ses badges restent
  const aRetirer = await baseDeDonnees.compte.findMany({
    where: { derniereConnexion: { lt: avant(INACTIVITE_ROLE) }, ambassadeur: { isNot: null } },
    select: { id: true },
  });
  let ambassadeursRetires = 0;
  for (const { id } of aRetirer) if (await retirerDuProgramme(id)) ambassadeursRetires += 1;
  // 2 ans sans connexion : tout le compte est effacé. Un compte effacé emporte avec lui (en cascade) son ambassadeur, ses
  // sessions, badges, points, candidatures, missions, messages et lectures ; ses propositions de lieux restent, sans lien
  const comptesInactifs = await baseDeDonnees.compte.deleteMany({ where: { derniereConnexion: { lt: avant(INACTIVITE_COMPTE) } } });
  const candidatures = await baseDeDonnees.candidatureFondateur.deleteMany({ where: { statut: "refusee", reponduLe: { lt: limiteCandidatures } } });
  const candidaturesCertification = await baseDeDonnees.candidatureCertification.deleteMany({
    where: { statut: "refusee", reponduLe: { lt: limiteCandidatures } },
  });
  const liens = await baseDeDonnees.compte.updateMany({
    where: { jetonExpireLe: { lt: maintenant } },
    data: { jetonReinitialisation: null, jetonExpireLe: null },
  });
  const liensVerification = await baseDeDonnees.compte.updateMany({
    where: { jetonVerificationExpireLe: { lt: maintenant } },
    data: { jetonVerification: null, jetonVerificationExpireLe: null },
  });
  const suggestions = await baseDeDonnees.suggestionLieu.deleteMany({ where: { decideLe: { lt: avant(GARDE_SUGGESTION) } } });
  // Preuve, SIRET et réponse de l'équipe partent avec la ligne ; le lieu reste (vérifié tant qu'un autre rattachement est validé)
  const rattachements = await baseDeDonnees.rattachementLieu.deleteMany({
    where: { statut: { in: ["refuse", "retire"] }, decideLe: { lt: avant(GARDE_RATTACHEMENT_CLOS) } },
  });
  return {
    sessions: sessions.count,
    ambassadeursRefuses,
    ambassadeursRetires,
    comptesInactifs: comptesInactifs.count,
    candidatures: candidatures.count,
    candidaturesCertification: candidaturesCertification.count,
    liens: liens.count + liensVerification.count,
    suggestions: suggestions.count,
    rattachements: rattachements.count,
  };
}
