import { DUREE_CONVERSATION_SANS_MESSAGE_JOURS, DUREE_DEPART_GROUPE_JOURS, DUREE_INVITATION_GROUPE_JOURS } from "../../../../../packages/commun/src/regles/chat.ts";
import { DUREE_CLOCHE_JOURS, DUREE_CLOCHE_MODERATION_JOURS } from "../../../../../packages/commun/src/regles/cloche.ts";
import { DUREE_DEMANDE_BANDE_JOURS } from "../../../../../packages/commun/src/regles/potes.ts";
import { DUREE_GARDE_SIGNALEMENT_JOURS } from "../../../../../packages/commun/src/regles/signalement.ts";
import { DUREE_DEMANDE_SUIVI_JOURS } from "../../../../../packages/commun/src/regles/suivis.ts";
import { DUREE_REFUS_CO_AUTEUR_JOURS } from "../../services/listes-regles.ts";

const UN_JOUR = 86_400_000;
/** Éléments retirés de sa vue : gardés 13 mois (la plupart de leurs cibles ont disparu avant) */
const DUREE_MASQUES_JOURS = 395;

/** Les dates limites du ménage social de la nuit (E.1) : ce qui est plus ancien que sa limite part */
export type SeuilsMenageSocial = {
  /** Étape 1 : un média dont media_expire_le est passé (posé à l'envoi : + DUREE_MEDIAS_CHAT_JOURS, 90 jours) */
  medias: Date;
  /** Étape 2 : dernier message (et date de la sortie liée) avant cette date : 1 an */
  conversations: Date;
  /** Étape 4 : demandes de bande (refusées ou non), 30 jours */
  demandesBande: Date;
  /** Demandes de suivi en attente ou refusées, 30 jours */
  demandesSuivi: Date;
  /** Invitations à un groupe en attente ou refusées, 30 jours (décision de Hugo du 14/10/2026), puis on peut réinviter */
  invitationsGroupes: Date;
  /** Invitations à remplir une liste en attente ou refusées, 30 jours */
  coAuteurs: Date;
  /** Invitations en attente ou refusées d'une sortie dont la date est passée */
  sortiesPassees: Date;
  /** Départs volontaires d'un groupe, 30 jours */
  departs: Date;
  /** Clés d'idempotence des créations, 24 h */
  cles: Date;
  /** Étape 5 : cloche, 90 jours… */
  cloche: Date;
  /** … et 6 mois pour les trois types de la modération (on peut contester pendant 6 mois) */
  clocheModeration: Date;
  /** Étape 6 : éléments retirés de sa vue, 13 mois */
  masques: Date;
  /** Étape 7 : contenus retirés par la modération depuis plus d'un an (la garde des signalements après décision) */
  contenusRetires: Date;
  /** Étape 8 : fichiers du dossier des médias que la base ne connaît pas, plus de 24 h */
  orphelins: Date;
};

/** Les dates limites du ménage social, à partir de maintenant (E.1, durées de packages/commun/src/regles/) */
export function calculerSeuilsMenageSocial(maintenant: Date): SeuilsMenageSocial {
  const t = maintenant.getTime();
  const avant = (jours: number) => new Date(t - jours * UN_JOUR);
  return {
    medias: new Date(t),
    conversations: avant(DUREE_CONVERSATION_SANS_MESSAGE_JOURS),
    demandesBande: avant(DUREE_DEMANDE_BANDE_JOURS),
    demandesSuivi: avant(DUREE_DEMANDE_SUIVI_JOURS),
    invitationsGroupes: avant(DUREE_INVITATION_GROUPE_JOURS),
    coAuteurs: avant(DUREE_REFUS_CO_AUTEUR_JOURS),
    sortiesPassees: new Date(t),
    departs: avant(DUREE_DEPART_GROUPE_JOURS),
    cles: avant(1),
    cloche: avant(DUREE_CLOCHE_JOURS),
    clocheModeration: avant(DUREE_CLOCHE_MODERATION_JOURS),
    masques: avant(DUREE_MASQUES_JOURS),
    contenusRetires: avant(DUREE_GARDE_SIGNALEMENT_JOURS),
    orphelins: avant(1),
  };
}
