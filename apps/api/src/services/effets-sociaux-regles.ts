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
  /** Qui agit ; null : l'équipe SOS Miam (décisions de la modération) */
  acteurId: number | null;
  cible?: { type: CibleCloche; id: string };
  /** 120 caractères au plus (coupé au-delà) : titre d'une sortie, nom du lieu retenu, motif d'une décision ; jamais le titre d'un groupe */
  detail?: string;
  /** « … te suit en retour » */
  enRetour?: boolean;
};

/** Les notifications sociales sur le téléphone qui ne sont pas des messages (C.5) */
export type SortePush = "bande-ajout" | "bande-acceptee" | "invitation-sortie" | "sortie-lieu-choisi";

/**
 * Une notification sur le téléphone. `regroupement` (« conversation:<id> ») : une par conversation, la suivante remplace la
 * précédente ; `sonore` (vrai par défaut) est posé par l'applicateur. Ces deux champs sont lus par expedierPush une fois
 * ajoutés à MessagePush (lot L4) ; d'ici là, ils sont ignorés sans rien casser. Jamais le texte d'un message : seulement le
 * prénom et la sorte de message (il passerait en clair par Apple et Google).
 */
export type MessagePushSocial = MessagePush & { regroupement?: string; sonore?: boolean };

export type EffetSocial =
  | { quoi: "cloche"; notification: NouvelleNotificationCloche }
  | { quoi: "push"; compteId: number; message: MessagePushSocial; sorte: "message" | SortePush };

/** Applique des effets : la cloche est écrite quand la promesse se résout ; le téléphone part après, sans être attendu */
export type AppliquerEffetsSociaux = (effets: readonly EffetSocial[]) => Promise<void>;

/** Dans une même conversation, le premier message sonne ; les suivants, dans les 30 s, arrivent sans son (choix de construction) */
export const DELAI_SANS_SON_MS = 30_000;
