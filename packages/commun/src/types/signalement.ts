/** Pourquoi une publication est signalée : l'app propose ces raisons, la modération (logiciel de gestion) les trie. */
export const RAISONS_SIGNALEMENT = [
  "faux-lieu",
  "pub-cachee",
  "arnaque",
  "haine",
  "choquant",
  "danger",
  "vie-privee",
  "vol-contenu",
  "autre",
] as const;

export type RaisonSignalement = (typeof RAISONS_SIGNALEMENT)[number];

/**
 * Où en est un signalement côté modération (logiciel de gestion), décidé à la main :
 * « a-traiter » en attente, « retenu » le contenu est retiré pour de bon, « rejete » rien à redire, le contenu reste ou revient en ligne.
 */
export const STATUTS_SIGNALEMENT = ["a-traiter", "retenu", "rejete"] as const;

export type StatutSignalement = (typeof STATUTS_SIGNALEMENT)[number];

/** Un signalement de publication, tel que l'app l'enverra à l'API. */
export type Signalement = {
  publicationId: string;
  lieuId: number;
  raison: RaisonSignalement;
  /** Précision choisie parmi celles proposées pour la raison (null si aucune) */
  precision: string | null;
  /** Ce que la personne a expliqué avec ses mots (peut être vide, sauf quand la raison l'exige) */
  explication: string;
  /** Date du signalement (ISO 8601) */
  date: string;
};

/** Ce qu'on peut signaler dans la partie sociale (CIBLES_SIGNALEMENT_SOCIAL de regles/signalement.ts). Un lieu envoyé est un message. */
export type CibleSignalementSocial = "commentaire" | "message" | "liste" | "profil" | "sortie" | "groupe" | "idee" | "comment-idee" | "miamis";

/**
 * Ce sur quoi la modération peut décider, vu dans « Décisions de la modération » (CIBLES_DECISION_MODERATION de
 * regles/signalement.ts) : les contenus sociaux, plus un avis et la réponse d'un lieu à un avis, masqués par l'équipe à la
 * relecture (décision du 15/10/2026). Un avis ne se signale pas par l'app comme un contenu social : il n'est pas dans
 * CibleSignalementSocial.
 */
export type CibleDecisionModeration = CibleSignalementSocial | "avis" | "reponse-avis";

/**
 * Un signalement de commentaire, de message (lieu envoyé compris, avec son petit mot), de liste, de profil, de sortie ou de
 * groupe (mêmes raisons que pour une publication). « recommandation » ne sert plus qu'à la démo de l'app, en attendant
 * son nettoyage (lots A3 et A7) : l'API ne la reçoit jamais (validerSignalementContenu la refuse).
 */
export type SignalementContenu = {
  cible: CibleSignalementSocial | "recommandation";
  /** Identifiant du commentaire, du message, de la liste, de la sortie, du groupe, ou identifiant public de la personne */
  cibleId: string;
  raison: RaisonSignalement;
  precision: string | null;
  explication: string;
  /** Date du signalement (ISO 8601) */
  date: string;
};

/** Rendu par validerSignalementContenu (commun) ; l'API l'importe (commun n'importe jamais apps/api) */
export type SignalementSocialValide = {
  cible: CibleSignalementSocial;
  cibleId: string;
  raison: RaisonSignalement;
  precision: string | null;
  explication: string;
};

/** Une décision de la modération qui te concerne (GET /app/moderation/mes-decisions), jamais qui a signalé */
export type DecisionModerationApi = {
  id: string;
  cible: CibleDecisionModeration;
  role: "auteur" | "signale";
  /** « masque » : masqué en attendant la modération (auteur seulement) */
  statut: "masque" | "retenu" | "rejete";
  motif: string | null;
  motivation: string | null;
  decideLe: string | null;
  contestableJusqua: string | null;
  contestation: "aucune" | "envoyee" | "reexaminee";
};
