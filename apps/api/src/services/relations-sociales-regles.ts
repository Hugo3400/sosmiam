// Le socle des relations entre personnes (spécification sociale D.1), lu par tous les domaines sociaux : retrouver un compte
// par son identifiant public, présenter des personnes en petit, liens entre moi et d'autres (bande, suivis, demandes,
// blocages), blocages dans les deux sens, verrous et clés d'idempotence des créations. Contrat commun du service Prisma
// (relations-sociales.ts) et de son double en mémoire (relations-sociales-en-memoire.ts). Aucune règle d'âge : l'app est
// réservée aux majeurs.
import type { PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";

/** Une transaction Prisma déjà ouverte (le double en mémoire l'ignore) */
export type TransactionSociale = Prisma.TransactionClient;

/** Ce qu'une création rejouée retrouve par sa clé « Idempotency-Key » (CleIdempotence, VarChar(8)) */
export type RessourceIdempotente = "groupe" | "sortie" | "liste" | "miamis" | "idee";

export type LienEntre = {
  pote: boolean;
  bloqueParMoi: boolean;
  mABloque: boolean;
  /** Mon suivi vers elle : « demande » aussi pour une demande qu'elle a refusée (en silence, je ne le sais pas) */
  jeSuis: "aucun" | "demande" | "suivi";
  meSuit: boolean;
  /** Elle a demandé à me suivre (demande en attente, pas refusée) */
  meDemande: boolean;
  /**
   * « envoyee » : ma demande de bande, même refusée (en silence) ; « recue » : la sienne, si je ne l'ai pas refusée. Les deux à
   * la fois (demandes croisées) : « envoyee » d'abord (le lot L3 peut changer cette priorité, dans les deux versions)
   */
  demandeBande: "envoyee" | "recue" | null;
};

export interface RelationsSociales {
  /** Le compte d'un identifiant public ; null : inconnu, sans profil social (ou sans pseudo), ou (si `pour` est donné) il a bloqué `pour` */
  trouverCompte(idPublic: string, pour?: number): Promise<number | null>;
  /** Même règle, pour plusieurs : identifiant public → compte (les inconnus sont absents de la carte) */
  trouverComptes(idsPublics: readonly string[], pour?: number): Promise<Map<string, number>>;
  /** Ce qu'on montre en petit ; les comptes sans profil social (ou sans pseudo) sont absents de la carte */
  presenter(compteIds: readonly number[]): Promise<Map<number, PersonneResume>>;
  /** Mes liens avec chacun de ces comptes (tous présents dans la carte, même sans aucun lien) */
  lireLiens(moi: number, autres: readonly number[]): Promise<Map<number, LienEntre>>;
  /** Mes potes, du plus récent au plus ancien */
  listerPotes(moi: number): Promise<number[]>;
  /** parMoi : ceux que j'ai bloqués ; contreMoi : ceux qui m'ont bloqué ; caches : l'union des deux (« visible pour moi ») */
  listerBlocages(moi: number): Promise<{ parMoi: number[]; contreMoi: number[]; caches: Set<number> }>;
  /**
   * Un blocage existe-t-il entre a et b, dans un sens ou dans l'autre ? Relu par CHAQUE création de lien (bande, suivi,
   * co-auteur, invitation, membre, privé) dans SA transaction déjà verrouillée (`tx`) : un geste lancé au moment d'un
   * blocage ne recrée rien.
   */
  bloqueEntre(a: number, b: number, tx?: TransactionSociale): Promise<boolean>;
  /** Ceux de ces comptes qui veulent les notifications sociales sur leur téléphone (profil social, pushSocial vrai) */
  lirePushSocial(compteIds: readonly number[]): Promise<Set<number>>;
  /** Parmi ces comptes, ceux qui veulent le message en entier dans la notification (profils_sociaux.apercu_messages) */
  lireApercuMessages(compteIds: readonly number[]): Promise<Set<number>>;
  /**
   * Verrou des lignes de ces comptes (SELECT … FROM comptes … ORDER BY id FOR UPDATE), dans la transaction : quotas
   * durables (taille d'une bande, médias) et liens entre deux comptes comptés sans course (B.12). Rien en mémoire.
   */
  verrouillerComptes(tx: TransactionSociale, compteIds: readonly number[]): Promise<void>;
  /**
   * La création déjà faite avec cette clé « Idempotency-Key », ou null : le second envoi rend la première. La clé est
   * effacée après 24 h par le ménage de nuit (l'app en tire toujours une neuve)
   */
  lireIdempotence(compteId: number, cle: string, ressource: RessourceIdempotente, tx?: TransactionSociale): Promise<number | null>;
  /**
   * Note la création, dans la transaction qui la fait. Faux si la clé était déjà prise (deux envois en même temps) :
   * l'appelant annule sa transaction, relit (lireIdempotence) et rend la première création ; si la relecture ne rend rien,
   * la clé a servi à autre chose (un groupe, puis une liste) : 400 champ-invalide { champ: "idClient" }.
   */
  noterIdempotence(compteId: number, cle: string, ressource: RessourceIdempotente, ressourceId: number, maintenant: Date, tx?: TransactionSociale): Promise<boolean>;
}

/** Les liens d'un compte avec un autre, sans rien entre eux */
export const AUCUN_LIEN: Readonly<LienEntre> = {
  pote: false, bloqueParMoi: false, mABloque: false, jeSuis: "aucun", meSuit: false, meDemande: false, demandeBande: null,
};
