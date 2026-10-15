// Les effets d'un geste social (spécification sociale D.1) : une notification dans la cloche, ou une notification sur le
// téléphone. Les services les RENDENT dans leur résultat, déjà filtrés (pushSocial, conversation coupée, blocages dans les
// deux sens, envoi rejoué : aucun effet) ; le contrôleur les applique (controleurs/effets-sociaux.ts) : la cloche avant la
// réponse, le téléphone après, sans jamais retarder ni faire échouer la demande. Réponse de Hugo du 14/10/2026 (I.15 a) :
// TOUTES les notifications sociales sur le téléphone sont hors anti-spam, comme les messages (prevenirCompte).
import type { CibleCloche, TypeCloche } from "../../../../packages/commun/src/types/cloche.ts";
import type { MessagePush } from "./notifications/expedier-push.ts";

export type NouvelleNotificationCloche = {
  /** Qui la reçoit */
  compteId: number;
  type: TypeCloche;
  /** Qui agit ; null : personne en particulier (l'équipe SOS Miam et ses décisions, un contenu masqué, la fin automatique
   *  d'un vote « sortie-lieu-choisi », un lien changé tout seul « lien-renouvele », la réponse d'un lieu « reponse-commentaire »
   *  avec detail « lieu ») ; la cloche ne prévient jamais l'acteur lui-même */
  acteurId: number | null;
  cible?: { type: CibleCloche; id: string };
  /** 120 caractères au plus (coupé au-delà) : titre d'une sortie, nom du lieu retenu, motif d'une décision, ou un mot-clé
   *  (« lieu », « choquant », « masque-par-le-lieu », « retenu », « rejete ») ; jamais le titre d'un groupe */
  detail?: string;
  /** « … te suit en retour » */
  enRetour?: boolean;
};

/** Les notifications sociales sur le téléphone qui ne sont pas des messages (C.5) */
export type SortePush = "bande-ajout" | "bande-acceptee" | "invitation-sortie" | "invitation-groupe" | "sortie-lieu-choisi";

/**
 * Une notification sur le téléphone. `regroupement` (« conversation:<id> ») : une par conversation, la suivante remplace la
 * précédente ; `sonore` (vrai par défaut) et `social` (canal « messages » sur Android) sont posés par l'applicateur. Tous
 * sont des champs de MessagePush, lus par expedierPush (apns-collapse-id et thread-id chez Apple, tag chez Google ; sur
 * Android 8 et plus, le son dépend du canal).
 * Jamais le texte d'un message : seulement le prénom et la sorte de message (il passerait en clair par Apple et Google).
 */
export type MessagePushSocial = MessagePush;

export type EffetSocial =
  | { quoi: "cloche"; notification: NouvelleNotificationCloche }
  | { quoi: "push"; compteId: number; message: MessagePushSocial; sorte: "message" | SortePush };

/** Applique des effets : la cloche est écrite quand la promesse se résout ; le téléphone part après, sans être attendu */
export type AppliquerEffetsSociaux = (effets: readonly EffetSocial[]) => Promise<void>;

/**
 * Dans une même conversation, un message sonne ; ceux qui arrivent moins de 30 s après le dernier qui a sonné arrivent sans
 * son (choix de construction)
 */
export const DELAI_SANS_SON_MS = 30_000;
