// Règles de Potes (décidées le 8 octobre 2026, voir docs/decisions.md).
import type { CibleMasque } from "../types/social.ts";

/** Identifiant de la personne qui utilise l'app, dans les sorties, listes et recommandations */
export const ID_MOI = "moi";

/** Pseudo : 3 à 20 caractères, minuscules, chiffres, point et tiret bas, sans commencer ni finir par un point ou un tiret bas */
export const FORME_PSEUDO = /^[a-z0-9](?:[a-z0-9._]{1,18})[a-z0-9]$/;

export const LONGUEUR_MAX_TITRE_SORTIE = 40;
export const LONGUEUR_MAX_MESSAGE = 500;
export const LONGUEUR_MAX_MOT_RECOMMANDATION = 140;
export const MAX_PROPOSITIONS_SORTIE = 8;
/** Organisateur et invitations en attente compris (les refus ne comptent pas) : 14 invités au plus à la création */
export const MAX_PARTICIPANTS_SORTIE = 15;

// Bande, lien d'invitation, blocages et sorties servis par l'API (décidé le 14 octobre 2026, docs/decisions.md « Potes,
// messagerie et profils sur le serveur »). Les nombres sans décision de Hugo sont des choix de construction à lui confirmer.

/** Identifiant public d'une personne (10 caractères tirés au hasard), seul identifiant que l'app connaît, jamais l'id du compte */
export const FORME_ID_PUBLIC = /^[a-z2-9]{10}$/;

/** 200 potes au plus dans une bande, des deux côtés */
export const MAX_BANDE = 200;
/** Une demande par pseudo expire au bout de 30 jours ; un refus reste noté autant (pas de demande en boucle) */
export const DUREE_DEMANDE_BANDE_JOURS = 30;
export const MAX_DEMANDES_BANDE_EN_ATTENTE = 50;
/** Code secret du lien et du QR d'invitation, tiré par le serveur, sans date de fin (réponse de Hugo du 14/10/2026) */
export const LONGUEUR_CODE_INVITATION = 12;
export const MAX_BLOCAGES = 1000;
/** Au-delà de 10 arrivées en 24 h par un même lien, il change tout seul (« lien-renouvele » dans la cloche) */
export const MAX_ARRIVEES_PAR_LIEN_24H = 10;
/** Éléments retirés de sa propre vue (sortie passée, ligne de « Quoi de neuf », liste, lieu reçu, suggestion) */
export const MAX_MASQUES = 2000;
export const CIBLES_MASQUE = ["sortie", "activite", "liste", "lieu-recu", "suggestion"] as const satisfies readonly CibleMasque[];

/** Une sortie se crée au moins 15 minutes et au plus 366 jours à l'avance */
export const DELAI_MIN_SORTIE_MINUTES = 15;
export const DELAI_MAX_SORTIE_JOURS = 366;
/** La fin du vote : au moins 10 minutes plus tard, et au plus tard à l'heure de la sortie */
export const DELAI_MIN_FIN_VOTE_MINUTES = 10;
export const RAPPEL_SORTIE_MINUTES_AVANT = 60;
export const DELAI_MIN_RAPPEL_SORTIE_MINUTES = 70;
/** Sorties à venir organisées par une même personne */
export const MAX_SORTIES_A_VENIR = 20;
