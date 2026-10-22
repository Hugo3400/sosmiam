// Règles du chat entre potes (décidées le 8 octobre 2026, voir docs/decisions.md).
// Messages : même longueur et même filtre que les discussions de sortie (LONGUEUR_MAX_MESSAGE, contientMotInterdit).
// Messagerie servie par l'API (décidée le 14 octobre 2026) : textes chiffrés, médias effacés 90 jours après l'envoi.
// Les nombres sans décision de Hugo sont des choix de construction à lui confirmer.
import type { ReactionChat } from "../types/conversations.ts";
import type { CodeReaction } from "../types/messagerie.ts";

const MO = 1024 * 1024;
const GO = 1024 * MO;

export const DUREE_MAX_VOCAL_SECONDES = 60;
/** Membres et invitations en attente compris, créateur compris : 19 invités au plus à la création */
export const MAX_PARTICIPANTS_GROUPE = 20;
export const LONGUEUR_MAX_TITRE_GROUPE = 40;

/**
 * Les potes ajoutés « en vrai » (par lien, QR code, ou la bande d'exemple), pas par pseudo :
 * ils voient en entier ton profil même s'il est privé (calculerVisibiliteProfil). Démo seulement : avec l'API, la bande se
 * fait toujours avec l'accord des deux, et c'est calculerNiveauProfil qui décide.
 */
export const MOYENS_AJOUT_EN_VRAI: readonly string[] = ["lien", "qr", "exemple"];

/** Les réactions telles que l'API les range (5 codes fixes, sans texte), dans l'ordre de REACTIONS_CHAT */
export const CODES_REACTIONS = ["coeur", "rire", "miam", "pouce", "surprise"] as const satisfies readonly CodeReaction[];

/** L'emoji affiché pour chaque code de réaction (convertirCodeEnReaction et convertirReactionEnCode) */
export const REACTIONS_PAR_CODE: Readonly<Record<CodeReaction, ReactionChat>> = {
  coeur: "❤️",
  rire: "😂",
  miam: "🤤",
  pouce: "👍",
  surprise: "😮",
};

/** Photo : JPEG de 5 Mo et 4 096 px de côté au plus ; l'app la réduit à 2 048 px avant l'envoi */
export const TAILLE_MAX_PHOTO_CHAT = 5 * MO;
export const COTE_MAX_PHOTO_CHAT = 4096;
export const COTE_ENVOI_PHOTO_CHAT = 2048;
/** Note vocale : M4A de 2 Mo au plus ; durée relue par le serveur, 60 s plus cette tolérance */
export const TAILLE_MAX_VOCAL_CHAT = 2 * MO;
export const TOLERANCE_DUREE_VOCAL_SECONDES = 1;

/** Photos et notes vocales effacées du serveur 90 jours après l'envoi (« Ce média a expiré ») */
export const DUREE_MEDIAS_CHAT_JOURS = 90;
/** Une conversation sans nouveau message depuis 1 an est effacée la nuit */
export const DUREE_CONVERSATION_SANS_MESSAGE_JOURS = 365;
export const MAX_MEDIAS_PAR_JOUR = 50;
/** « Envoyer à un pote » : 20 potes de ta bande au plus par envoi */
export const MAX_DESTINATAIRES_LIEU = 20;
/** Taille gardée par compte (photos et vocaux encore sur le serveur) */
export const QUOTA_MEDIAS_COMPTE_OCTETS = GO;
/** Tous les comptes ensemble, par 24 h */
export const PLAFOND_MEDIAS_SERVEUR_JOUR_OCTETS = 20 * GO;
/** Sous 15 % de disque libre, plus aucun envoi de média (le disque est celui de la base) */
export const PART_LIBRE_MIN_DISQUE = 0.15;

/** Qui quitte un groupe de lui-même ne peut pas y être réinvité pendant 30 jours */
export const DUREE_DEPART_GROUPE_JOURS = 30;
/**
 * Invitation dans un groupe (réponse de Hugo du 14/10/2026 : on entre en acceptant, comme dans une sortie). En attente ou
 * refusée en silence, elle est effacée 30 jours après l'invitation : un refus empêche autant de réinviter la personne.
 */
export const DUREE_INVITATION_GROUPE_JOURS = 30;

/** idClient d'un envoi (message, média, lieu envoyé, création) : un UUID v4 en minuscules, tiré par l'app */
export const FORME_ID_CLIENT = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const DELAI_MODIFICATION_MESSAGE_MINUTES = 15;
export const MAX_PHOTOS_ALBUM = 10;
export const MAX_CONVERSATIONS_EPINGLEES = 3;
export const MAX_MENTIONS_MESSAGE = 5;
export const LONGUEUR_MAX_EXTRAIT_CITATION = 120;
export const FORME_ONDE_VOCAL = /^[0-9]{16,48}$/;
