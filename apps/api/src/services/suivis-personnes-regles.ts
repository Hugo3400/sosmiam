// Suivre une personne (spécification sociale B.3, D.2) : contrat commun du service Prisma (suivis-personnes.ts) et de son
// double en mémoire (suivis-personnes-en-memoire.ts). À sens unique : un compte public est suivi tout de suite
// (« nouvel-abonne » dans sa cloche), un compte privé reçoit une demande. Un refus est silencieux : celui qui suit voit
// toujours « demande envoyée », et la demande ne repart pas avant son expiration (30 jours). On ne prévient jamais l'autre
// d'un refus, d'un retrait ni d'un « ne plus suivre ». Suivre ne donne jamais accès au chat. Les lieux et les pseudos de
// créateurs se suivent ailleurs (/app/activite). Aucune règle d'âge : l'app est réservée aux majeurs.
import { DUREE_DEMANDE_SUIVI_JOURS } from "../../../../packages/commun/src/regles/suivis.ts";
import type { PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import type { LienSuiviApi, PageLiensSuiviApi, ResumeSuivisApi } from "../../../../packages/commun/src/types/suivis.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";

export type ResultatSuivre =
  | { ok: true; etat: "suivi" | "demande"; deja: boolean; effets: EffetSocial[] }
  | { ok: false; erreur: "trop-d-abonnements" | "personne-inconnue" | "soi-meme" };

export interface ServicesSuivisPersonnes {
  /** Compteurs, demandes reçues (sans celles que j'ai refusées) et envoyées (refusées comprises, vues « demande »), 50 chacune */
  lireResume(compteId: number, maintenant: Date): Promise<ResumeSuivisApi>;
  /** Mes abonnés (acceptés), 50 par page, les plus récents d'abord, sans les personnes bloquées ; apres : la `suite` d'avant */
  listerAbonnes(compteId: number, apres: string | null): Promise<PageLiensSuiviApi>;
  /** Mes abonnements à des personnes (acceptés), même règle */
  listerAbonnements(compteId: number, apres: string | null): Promise<PageLiensSuiviApi>;
  /**
   * Sous le verrou des deux comptes, blocage relu dans la transaction (personne-inconnue : on ne dit jamais qu'on est
   * bloqué) ; « suivi » (compte public) ou « demande » (compte privé). Une demande déjà faite, ou refusée en silence, rend
   * « demande » et deja: true : elle ne repart pas avant ses 30 jours. 2 000 abonnements au plus
   */
  suivre(compteId: number, cibleId: number, maintenant: Date): Promise<ResultatSuivre>;
  /** Ne plus suivre, ou annuler ma demande (refusée ou non) */
  nePlusSuivre(compteId: number, cibleId: number): Promise<void>;
  /** Sa demande (même refusée par moi) : acceptée, « demande-acceptee » pour elle ; déjà acceptée : ok, sans rien de plus */
  accepter(compteId: number, deId: number, maintenant: Date): Promise<{ ok: true; lien: LienSuiviApi; effets: EffetSocial[] } | { ok: false; erreur: "demande-inconnue" }>;
  /** Statut « refuse », sans prévenir : la demande ne peut plus être renvoyée avant son expiration (30 jours) */
  refuser(compteId: number, deId: number): Promise<void>;
  /** Retirer un abonné (accepté), sans prévenir */
  retirerAbonne(compteId: number, abonneId: number): Promise<void>;
  /** Écrit Compte.prive ; vers « public » : accepte les demandes en attente dans la même transaction */
  changerConfidentialite(compteId: number, prive: boolean, maintenant: Date): Promise<{ prive: boolean; acceptees: number; effets: EffetSocial[] }>;
  /** Accepte les demandes en attente (« demande-acceptee » pour chacune) ; aussi pour PATCH /comptes/moi/profil { prive: false } */
  accepterDemandesEnAttente(compteId: number, maintenant: Date): Promise<EffetSocial[]>;
}

/** Demandes reçues ou envoyées rendues par GET /app/suivis-personnes */
export const DEMANDES_SUIVI_LUES = 50;

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Une demande de suivi (ou son refus) plus vieille que 30 jours n'existe plus (le ménage de nuit l'efface ; d'ici là, on l'ignore) */
export const debutDemandesSuiviValides = (maintenant: Date) => new Date(maintenant.getTime() - DUREE_DEMANDE_SUIVI_JOURS * JOUR_MS);

/** « … te suit » (enRetour : « … te suit en retour ») dans la cloche de la personne suivie */
export const effetNouvelAbonne = (suiviId: number, suiveurId: number, enRetour: boolean): EffetSocial => ({
  quoi: "cloche", notification: { compteId: suiviId, type: "nouvel-abonne", acteurId: suiveurId, enRetour },
});

/** « … a accepté ta demande » dans la cloche de celui qui suit (rien sur le téléphone, C.5) */
export const effetDemandeAcceptee = (suiveurId: number, suiviId: number): EffetSocial => ({
  quoi: "cloche", notification: { compteId: suiveurId, type: "demande-acceptee", acteurId: suiviId },
});

/** Le résumé tel que l'API le rend ; les comptes sans profil social (ou sans pseudo) n'y sont pas */
export function construireResume(
  o: { prive: boolean; abonnes: number; abonnements: number },
  recues: readonly { suiveurId: number; creeLe: Date }[],
  envoyees: readonly { suiviId: number; creeLe: Date }[],
  personnes: ReadonlyMap<number, PersonneResume>,
): ResumeSuivisApi {
  const lien = (id: number, creeLe: Date): LienSuiviApi[] => {
    const personne = personnes.get(id);
    return personne ? [{ personne, depuis: creeLe.toISOString() }] : [];
  };
  return {
    ...o,
    demandesRecues: recues.flatMap((d) => lien(d.suiveurId, d.creeLe)),
    demandesEnvoyees: envoyees.flatMap((d) => lien(d.suiviId, d.creeLe)),
  };
}
