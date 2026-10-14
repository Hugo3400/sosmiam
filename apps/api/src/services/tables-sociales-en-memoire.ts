// Les tables de la partie sociale EN MÉMOIRE, pour les tests (aucune base) : une Map ou un tableau par table de la
// spécification (A.1 à A.7), avec les formes exactes des lignes de Prisma (types du client généré). Chaque double de domaine
// (social, cloche, bande, messagerie, sorties, listes, commentaires, signalements) reçoit les MÊMES tables : il voit ce que
// les autres ont écrit, comme dans la vraie base. Le test prépare lui-même les lieux, publications, points, rescousses et
// gardes dont il a besoin. Les cascades et les SET NULL de la base sont rejoués par oublierCompteEnMemoire (compte
// supprimé) et effacerConversationsEnMemoire (sortie annulée, dernier départ, ménage), en fin de fichier.
import type {
  AbonnementListe, Blocage, CleIdempotence, CoAuteurListe, CommentairePublication, Conversation, DemandeBande, DepartGroupe,
  ElementMasque, InvitationGroupe, InvitationSortie, JaimeCommentaire, LieuDeListe, ListeLieux, MembreBande, MembreConversation,
  MessageConversation, NotificationCloche, ProfilSocial, PropositionSortie, ReactionMessage, Signalement, Sortie, SuiviPersonne,
  VoteSortie,
} from "../base-de-donnees/client-genere/client.ts";
import type { ConversationsEffacees } from "./effacer-conversations.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

/**
 * Ce que la partie sociale lit d'un compte. Mêmes noms que CompteEnMemoire (comptes-en-memoire.ts) : le banc d'essai passe
 * directement la Map des comptes en mémoire, et un pseudo changé par /comptes/moi/profil se voit tout de suite.
 */
export type CompteSocialEnMemoire = {
  id: number;
  pseudo: string | null;
  prenom: string;
  avatar: string | null;
  prive: boolean;
  /** Ville du profil de l'app */
  villeApp: string | null;
  points: number;
  palier: string;
  /** Codes des badges, du plus ancien au plus récent */
  badges: string[];
  /** E-mail confirmé (moment, en ms), ou null */
  emailVerifieLe: number | null;
  /** Création du compte (ms) */
  creeLe: number;
};

/** Un lieu ou une publication connus du test, et leur statut (« publie » / « publiee » : visibles) */
export type LieuSocialEnMemoire = { statut: string; nom?: string };
export type PublicationSocialeEnMemoire = { lieuId: number; statut: string };

export type TablesSociales = {
  comptes: Map<number, CompteSocialEnMemoire>;
  /** Par compte (clé primaire compte_id) */
  profils: Map<number, ProfilSocial>;
  bande: MembreBande[];
  demandes: DemandeBande[];
  blocages: Blocage[];
  suivis: SuiviPersonne[];
  masques: ElementMasque[];
  idempotence: CleIdempotence[];
  cloche: Map<number, NotificationCloche>;
  conversations: Map<number, Conversation>;
  membres: MembreConversation[];
  messages: Map<number, MessageConversation>;
  reactions: ReactionMessage[];
  departs: DepartGroupe[];
  invitationsGroupes: InvitationGroupe[];
  sorties: Map<number, Sortie>;
  invitationsSorties: InvitationSortie[];
  propositions: Map<number, PropositionSortie>;
  votes: VoteSortie[];
  listes: Map<number, ListeLieux>;
  lieuxListes: LieuDeListe[];
  coAuteurs: CoAuteurListe[];
  abonnementsListes: AbonnementListe[];
  commentaires: Map<number, CommentairePublication>;
  jaimesCommentaires: JaimeCommentaire[];
  signalements: Map<number, Signalement>;
  /** Préparés par le test */
  lieux: Map<number, LieuSocialEnMemoire>;
  publications: Map<number, PublicationSocialeEnMemoire>;
  journalPoints: { compteId: number; points: number; creeLe: Date }[];
  rescousses: { compteId: number; lieuId: number; creeLe: Date }[];
  gardes: { compteId: number; lieuId: number; creeLe: Date }[];
  /** Dernier id donné, par table à clé auto-incrémentée (prendreId) */
  derniersIds: Record<"cloche" | "conversations" | "messages" | "sorties" | "propositions" | "listes" | "commentaires" | "signalements", number>;
};

export type TableAIdentifiant = keyof TablesSociales["derniersIds"];

/** Des tables vides ; `comptes` : la Map des comptes à partager (celle de creerComptesEnMemoire), sinon une nouvelle */
export function creerTablesSocialesEnMemoire(comptes: Map<number, CompteSocialEnMemoire> = new Map()): TablesSociales {
  return {
    comptes,
    profils: new Map(),
    bande: [],
    demandes: [],
    blocages: [],
    suivis: [],
    masques: [],
    idempotence: [],
    cloche: new Map(),
    conversations: new Map(),
    membres: [],
    messages: new Map(),
    reactions: [],
    departs: [],
    invitationsGroupes: [],
    sorties: new Map(),
    invitationsSorties: [],
    propositions: new Map(),
    votes: [],
    listes: new Map(),
    lieuxListes: [],
    coAuteurs: [],
    abonnementsListes: [],
    commentaires: new Map(),
    jaimesCommentaires: [],
    signalements: new Map(),
    lieux: new Map(),
    publications: new Map(),
    journalPoints: [],
    rescousses: [],
    gardes: [],
    derniersIds: { cloche: 0, conversations: 0, messages: 0, sorties: 0, propositions: 0, listes: 0, commentaires: 0, signalements: 0 },
  };
}

/** Le prochain id d'une table (comme l'auto-incrément de PostgreSQL : jamais réutilisé) */
export function prendreId(tables: TablesSociales, table: TableAIdentifiant): number {
  tables.derniersIds[table] += 1;
  return tables.derniersIds[table];
}

/** Vrai s'il y a un blocage entre a et b, dans un sens ou dans l'autre */
export function bloquesEnMemoire(tables: TablesSociales, a: number, b: number): boolean {
  return tables.blocages.some((l) => (l.bloqueurId === a && l.bloqueId === b) || (l.bloqueurId === b && l.bloqueId === a));
}

/** Les comptes avec qui `moi` a un blocage, dans un sens ou dans l'autre */
export function listerCachesEnMemoire(tables: TablesSociales, moi: number): Set<number> {
  const caches = new Set<number>();
  for (const l of tables.blocages) {
    if (l.bloqueurId === moi) caches.add(l.bloqueId);
    else if (l.bloqueId === moi) caches.add(l.bloqueurId);
  }
  return caches;
}

/** Retire d'un tableau, sur place, les lignes qui répondent à `quoi` (comme un DELETE) */
function retirer<T>(lignes: T[], quoi: (ligne: T) => boolean): void {
  for (let i = lignes.length - 1; i >= 0; i--) if (quoi(lignes[i]!)) lignes.splice(i, 1);
}
/** Pareil pour une Map ; rend les clés retirées */
function retirerDeMap<T>(lignes: Map<number, T>, quoi: (ligne: T) => boolean): number[] {
  const retires = [...lignes].filter(([, ligne]) => quoi(ligne)).map(([id]) => id);
  for (const id of retires) lignes.delete(id);
  return retires;
}

/** Les cascades d'une sortie effacée (la base : invitations, propositions et leurs votes) */
function oublierSorties(tables: TablesSociales, sortieIds: readonly number[]): void {
  const sorties = new Set(sortieIds);
  if (sorties.size === 0) return;
  retirer(tables.invitationsSorties, (i) => sorties.has(i.sortieId));
  const propositions = new Set(retirerDeMap(tables.propositions, (p) => sorties.has(p.sortieId)));
  retirer(tables.votes, (v) => propositions.has(v.propositionId));
}

/** Les cascades de commentaires effacés : leurs J'aime partent, les réponses restent (reponseA remis à null) */
function oublierCommentaires(tables: TablesSociales, commentaireIds: readonly number[]): void {
  const commentaires = new Set(commentaireIds);
  if (commentaires.size === 0) return;
  retirer(tables.jaimesCommentaires, (j) => commentaires.has(j.commentaireId));
  for (const c of tables.commentaires.values()) if (c.reponseAId !== null && commentaires.has(c.reponseAId)) c.reponseAId = null;
}

/**
 * Ce que la base fait des tables sociales quand un compte est supprimé (les onDelete des .prisma) : à appeler après
 * effacerCompte du double des comptes (le banc d'essai le fait tout seul, voir creer-banc-social.ts).
 * - Cascade : profil, bande, demandes, blocages, suivis, masques, clés d'idempotence, cloche reçue ET cloche dont il est
 *   l'acteur, adhésions aux conversations, départs, réactions, invitations (groupes et sorties), votes, ses listes (avec
 *   leurs lieux, co-auteurs et abonnés), co-auteurs, abonnements aux listes, ses commentaires (avec leurs J'aime) et J'aime.
 * - SET NULL : auteur d'un message (« Compte supprimé »), créateur d'une conversation, qui a invité, organisateur d'une
 *   sortie, qui a proposé un lieu, qui a ajouté un lieu à une liste, qui a écrit au nom d'un lieu, réponse à un commentaire
 *   parti, qui a signalé et l'auteur du contenu signalé (le signalement et son instantané restent).
 */
export function oublierCompteEnMemoire(tables: TablesSociales, id: number): void {
  tables.profils.delete(id);
  retirer(tables.bande, (l) => l.compteId === id || l.poteId === id);
  retirer(tables.demandes, (l) => l.deId === id || l.aId === id);
  retirer(tables.blocages, (l) => l.bloqueurId === id || l.bloqueId === id);
  retirer(tables.suivis, (l) => l.suiveurId === id || l.suiviId === id);
  retirer(tables.masques, (l) => l.compteId === id);
  retirer(tables.idempotence, (l) => l.compteId === id);
  retirerDeMap(tables.cloche, (l) => l.compteId === id || l.acteurId === id);
  retirer(tables.membres, (l) => l.compteId === id);
  retirer(tables.departs, (l) => l.compteId === id);
  retirer(tables.reactions, (l) => l.compteId === id);
  retirer(tables.invitationsGroupes, (l) => l.compteId === id);
  retirer(tables.invitationsSorties, (l) => l.compteId === id);
  retirer(tables.votes, (l) => l.compteId === id);
  const listes = new Set(retirerDeMap(tables.listes, (l) => l.auteurId === id));
  retirer(tables.lieuxListes, (l) => listes.has(l.listeId));
  retirer(tables.coAuteurs, (l) => listes.has(l.listeId) || l.compteId === id);
  retirer(tables.abonnementsListes, (l) => listes.has(l.listeId) || l.compteId === id);
  oublierCommentaires(tables, retirerDeMap(tables.commentaires, (c) => c.auteurId === id));
  retirer(tables.jaimesCommentaires, (l) => l.compteId === id);
  for (const m of tables.messages.values()) if (m.auteurId === id) m.auteurId = null;
  for (const c of tables.conversations.values()) if (c.creeParId === id) c.creeParId = null;
  for (const i of tables.invitationsGroupes) if (i.inviteParId === id) i.inviteParId = null;
  for (const i of tables.invitationsSorties) if (i.inviteParId === id) i.inviteParId = null;
  for (const s of tables.sorties.values()) if (s.organisateurId === id) s.organisateurId = null;
  for (const p of tables.propositions.values()) if (p.proposeParId === id) p.proposeParId = null;
  for (const l of tables.lieuxListes) if (l.ajouteParId === id) l.ajouteParId = null;
  for (const c of tables.commentaires.values()) if (c.ecritParId === id) c.ecritParId = null;
  for (const s of tables.signalements.values()) {
    if (s.signaleParId === id) s.signaleParId = null;
    if (s.auteurContenuId === id) s.auteurContenuId = null;
  }
}

/**
 * effacerConversations (effacer-conversations.ts) sur les tables en mémoire, avec les mêmes cascades que la base : membres,
 * invitations aux groupes, messages et leurs réactions, départs, et la sortie avec ses invitations, propositions et votes.
 * Les fichiers des messages sont rendus ; apresTransaction() les retire du stockage, sauf ceux qu'un signalement ouvert garde
 * (pas encore jugé, ou contesté et pas encore réexaminé). Les signalements restent.
 */
export async function effacerConversationsEnMemoire(
  tables: TablesSociales, ids: readonly number[], medias: Pick<StockageMediasChat, "supprimer">,
): Promise<ConversationsEffacees> {
  const cibles = new Set(ids.filter((id) => tables.conversations.has(id)));
  if (cibles.size === 0) return { conversations: 0, fichiers: [], apresTransaction: async () => 0 };
  const dans = (l: { conversationId: number }) => cibles.has(l.conversationId);
  const fichiers = [...tables.messages.values()].flatMap((m) => (dans(m) && m.fichier ? [m.fichier] : []));
  const messages = new Set(retirerDeMap(tables.messages, dans));
  retirer(tables.reactions, (r) => messages.has(r.messageId));
  retirer(tables.membres, dans);
  retirer(tables.departs, dans);
  retirer(tables.invitationsGroupes, dans);
  oublierSorties(tables, retirerDeMap(tables.sorties, dans));
  for (const id of cibles) tables.conversations.delete(id);
  return {
    conversations: cibles.size,
    fichiers,
    apresTransaction: async () => {
      const gardes = new Set([...tables.signalements.values()]
        .filter((s) => s.fichierMedia !== null && (s.statut === "a-traiter" || (s.contesteLe !== null && s.reexamineLe === null)))
        .map((s) => s.fichierMedia));
      return medias.supprimer(fichiers.filter((f) => !gardes.has(f)));
    },
  };
}
