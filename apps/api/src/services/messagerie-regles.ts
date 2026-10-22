// Messagerie entre potes (spécification sociale B.4, B.8, D.2) : privé, groupes, discussions des sorties, messages, médias et
// lieux envoyés. Les règles sont écrites UNE fois (messagerie.ts et ses fichiers messagerie-*.ts, lieux-envoyes.ts),
// au-dessus des gestes élémentaires de TablesMessagerie : la base les fait dans messagerie-tables*.ts, le double des tests
// dans messagerie-en-memoire.ts. Ce fichier donne le contrat du service, les lignes lues et les gestes.
// Entrer dans un groupe demande d'accepter une invitation (réponse de Hugo du 14/10/2026, comme une sortie) : un invité
// n'est pas membre, il ne voit ni les messages ni les membres. Aucune règle d'âge : l'app est réservée aux majeurs.
import type {
  CodeReaction, ConversationApi, FilMessagesApi, InvitationGroupeApi, LieuEnvoyeApi, MessageApi, PageConversationsApi, PagePartagesApi,
  RoleConversation, TypeConversation, TypePartage,
} from "../../../../packages/commun/src/types/messagerie.ts";
import type { LigneMessage } from "../fonctions/social/presenter-message.ts";
import type { LigneSondage } from "../fonctions/social/presenter-sondage.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import type { ClientGif } from "./giphy.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import type { ConversationsEffacees } from "./effacer-conversations.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

export type { LigneMessage } from "../fonctions/social/presenter-message.ts";
export type { LigneSondage } from "../fonctions/social/presenter-sondage.ts";

/** Conversations par page de GET /app/conversations */
export const CONVERSATIONS_PAR_PAGE = 30;
/** Messages par page d'un fil (les derniers, ou ceux d'avant `avant`) */
export const MESSAGES_PAR_PAGE = 50;
/** Lieux reçus ou envoyés par page */
export const LIEUX_ENVOYES_PAR_PAGE = 30;
/** Invitations aux groupes rendues avec la première page des conversations */
export const MAX_INVITATIONS_LUES = 50;
export const PARTAGES_PAR_PAGE = 30;

/** Une conversation, telle que les règles la lisent ; sortie : la sortie dont c'est la discussion (titre et emoji en clair) */
export type LigneConversation = {
  id: number;
  type: TypeConversation;
  clePrive: string | null;
  titreChiffre: string | null;
  emoji: string | null;
  creeParId: number | null;
  version: number;
  dernierMessageLe: Date;
  modifieLe: Date;
  creeLe: Date;
  sortie: { id: number; titre: string; emoji: string } | null;
  photo: string | null;
};

export type LigneMembre = {
  conversationId: number;
  compteId: number;
  role: RoleConversation;
  visibleApres: number;
  luJusqua: number;
  luLe: Date | null;
  coupee: boolean;
  arriveLe: Date;
  epingleeLe: Date | null;
};

export type LigneRappelSortie = { id: number; conversationId: number; titre: string; quand: Date; creeLe: Date };

/** « invite » : en attente ; « refuse » : refusée en silence (on ne réinvite pas). Accepter efface la ligne */
export type LigneInvitationGroupe = {
  conversationId: number;
  compteId: number;
  inviteParId: number | null;
  statut: "invite" | "refuse";
  creeLe: Date;
  reponduLe: Date | null;
};

export type LigneReaction = { messageId: number; compteId: number; reaction: CodeReaction };

/** Les messages qu'un membre ne voit pas : avant son arrivée ou son « Effacer pour moi » (apres), d'un compte avec qui il y a
 *  un blocage (caches, dans un sens ou dans l'autre), ceux qu'il a signalés (exclus) */
export type FiltreMessages = { apres: number; caches: ReadonlySet<number>; exclus: ReadonlySet<number> };

export type CompteursMedias = { envoisCompte24h: number; octetsCompte: number; octetsServeur24h: number };

/**
 * Les gestes élémentaires sur les données de la messagerie : lire et écrire, sans aucune règle. Dans `ecrire`, ils passent
 * tous par la même transaction (verrous compris) ; hors de `ecrire`, ce sont de simples lectures.
 */
export interface TablesMessagerie {
  lireConversations(ids: readonly number[]): Promise<Map<number, LigneConversation>>;
  lireConversationPrivee(clePrive: string): Promise<LigneConversation | null>;
  /** Mes privés et groupes (pas les sorties), le dernier message le plus récent d'abord, après le curseur */
  listerMesConversations(compteId: number, apres: { date: Date; id: number } | null, nombre: number): Promise<LigneConversation[]>;
  /** SELECT … FOR UPDATE : faux si la conversation n'existe plus */
  verrouillerConversation(id: number): Promise<boolean>;
  /** version + 1 et modifieLe (dernierMessageLe aussi pour un message) ; la nouvelle version, ou null si elle n'existe plus */
  toucherConversation(id: number, maintenant: Date, message: boolean): Promise<number | null>;
  /** null : un privé avec cette clé existe déjà (deux demandes en même temps) */
  creerConversation(c: { type: TypeConversation; clePrive: string | null; emoji: string | null; creeParId: number; maintenant: Date }): Promise<number | null>;
  ecrireGroupe(id: number, m: { titreChiffre?: string; emoji?: string; photo?: string | null }): Promise<void>;
  /** effacerConversations du socle ; apresTransaction() à appeler une fois la transaction validée */
  effacerConversations(ids: readonly number[]): Promise<ConversationsEffacees>;

  lireMembres(conversationIds: readonly number[]): Promise<LigneMembre[]>;
  ajouterMembre(m: Omit<LigneMembre, "epingleeLe" | "luLe">): Promise<void>;
  modifierMembre(conversationId: number, compteId: number, m: Partial<Pick<LigneMembre, "role" | "coupee" | "epingleeLe">>): Promise<boolean>;
  /** luJusqua et visibleApres ne reculent jamais (deux téléphones du même compte en même temps) */
  avancerMembre(conversationId: number, compteId: number, m: { luJusqua?: number; visibleApres?: number; luLe?: Date | null }): Promise<void>;
  retirerMembre(conversationId: number, compteId: number): Promise<void>;
  listerMesEpinglees(compteId: number): Promise<LigneConversation[]>;
  compterEpinglees(compteId: number): Promise<number>;
  lireAccusesLecture(compteIds: readonly number[]): Promise<Set<number>>;

  lireInvitations(conversationIds: readonly number[]): Promise<LigneInvitationGroupe[]>;
  /** Mes invitations « invite » à des groupes, la plus récente d'abord */
  listerMesInvitations(compteId: number, nombre: number): Promise<LigneInvitationGroupe[]>;
  creerInvitations(lignes: readonly LigneInvitationGroupe[]): Promise<void>;
  refuserInvitation(conversationId: number, compteId: number, maintenant: Date): Promise<void>;
  supprimerInvitation(conversationId: number, compteId: number): Promise<boolean>;

  /** Ceux qui ont quitté ce groupe d'eux-mêmes depuis `depuis` */
  lireDeparts(conversationId: number, depuis: Date): Promise<Set<number>>;
  noterDepart(conversationId: number, compteId: number, maintenant: Date): Promise<void>;
  oublierDepart(conversationId: number, compteId: number): Promise<void>;

  lireMessage(id: number): Promise<LigneMessage | null>;
  lireMessages(ids: readonly number[]): Promise<Map<number, LigneMessage>>;
  lireMessageParIdClient(conversationId: number, idClient: string): Promise<LigneMessage | null>;
  /** Le plus récent d'abord, id > filtre.apres et < avant, sans les auteurs cachés ni les messages exclus */
  listerMessages(conversationId: number, filtre: FiltreMessages, avant: number | null, nombre: number): Promise<LigneMessage[]>;
  /** Le dernier message visible de chaque conversation (apres : celui de chacune) */
  lireDerniersMessages(conversations: readonly { id: number; apres: number }[], caches: ReadonlySet<number>, exclus: ReadonlySet<number>): Promise<Map<number, LigneMessage>>;
  /** Le plus grand id de message de chaque conversation (tous les messages) */
  lireDerniersIds(conversationIds: readonly number[]): Promise<Map<number, number>>;
  /** Messages d'un autre que moi après `depuis`, ni supprimés, ni masqués, ni retirés, ni d'un compte caché ; `max` au plus */
  compterNonLus(compteId: number, conversations: readonly { id: number; depuis: number }[], caches: ReadonlySet<number>, max: number): Promise<Map<number, number>>;
  /** null : ce idClient est déjà pris dans cette conversation (envoi rejoué en même temps) */
  insererMessage(m: Omit<LigneMessage, "id">): Promise<LigneMessage | null>;
  modifierMessage(id: number, m: Partial<Pick<LigneMessage, "texteChiffre" | "fichier" | "supprimeLe" | "modifieLe">>): Promise<void>;
  listerAlbum(conversationId: number, album: string, nombre: number): Promise<LigneMessage[]>;
  listerPartages(conversationId: number, type: TypePartage, filtre: FiltreMessages, avant: number | null, nombre: number, maintenant: Date): Promise<LigneMessage[]>;
  /** Les messages que ce compte a signalés : cachés pour lui, partout (B.10) */
  lireMessagesSignales(compteId: number): Promise<Set<number>>;

  lireReactions(messageIds: readonly number[]): Promise<LigneReaction[]>;
  /** Vrai si quelque chose a changé */
  basculerReaction(messageId: number, compteId: number, reaction: CodeReaction, oui: boolean, maintenant: Date): Promise<boolean>;

  /** Médias de ce compte depuis `depuis`, octets de ses médias encore sur le disque, octets de tous depuis `depuis` */
  compterMedias(compteId: number, depuis: Date): Promise<CompteursMedias>;

  estLieuPublie(lieuId: number): Promise<boolean>;
  /**
   * Messages « lieu » des privés : reçus (d'un autre, sans ceux retirés de ma vue) ou envoyés (les miens), visibles pour
   * moi, ni supprimés, ni masqués, ni retirés ; le plus récent d'abord ; autreId : l'autre membre du privé
   */
  listerLieuxEnvoyes(compteId: number, sens: "recus" | "envoyes", filtre: Omit<FiltreMessages, "apres">, apres: { date: Date; id: number } | null, nombre: number): Promise<{ message: LigneMessage; autreId: number | null }[]>;
  /** Le plus grand id de lieu reçu visible pour moi, au plus `jusqua` */
  lireDernierLieuRecu(compteId: number, jusqua: number, caches: ReadonlySet<number>): Promise<number | null>;
  /** ProfilSocial.lieuxRecusVusJusqua (0 sans profil) */
  lireLieuxVus(compteId: number): Promise<number>;
  /** Ne recule jamais */
  ecrireLieuxVus(compteId: number, jusqua: number): Promise<void>;

  creerSondage(s: { messageId: number; finLe: Date; options: readonly { ordre: number; lieuChiffre: string }[] }): Promise<void>;
  lireSondages(messageIds: readonly number[]): Promise<Map<number, LigneSondage>>;
  voterSondage(messageId: number, compteId: number, ordre: number, maintenant: Date): Promise<boolean>;
  retirerVoteSondage(messageId: number, compteId: number): Promise<boolean>;
  supprimerSondage(messageId: number): Promise<void>;
  listerSondagesEchus(maintenant: Date, nombre: number): Promise<{ messageId: number; conversationId: number }[]>;
  cloreSondage(messageId: number, gagnant: number | null, maintenant: Date): Promise<boolean>;
  lireNomsLieux(ids: readonly number[]): Promise<Map<number, string>>;
  listerSortiesARappeler(apres: Date, jusqua: Date, nombre: number): Promise<number[]>;
  prendreRappelSortie(sortieId: number, apres: Date, jusqua: Date, maintenant: Date): Promise<LigneRappelSortie | null>;
  lireParticipantsSortie(sortieId: number): Promise<number[]>;

  /** Pote de la bande de a, dans la transaction (un retrait de la bande au même moment ne laisse rien passer) */
  listerPotesParmi(compteId: number, ids: readonly number[]): Promise<Set<number>>;
  bloqueEntre(a: number, b: number): Promise<boolean>;
  /** Dans la transaction, AVANT la conversation : FOR NO KEY UPDATE (les clés étrangères des messages écrits ailleurs passent) */
  verrouillerComptes(ids: readonly number[]): Promise<void>;
  /** CleIdempotence « groupe » */
  lireIdempotence(compteId: number, cle: string): Promise<number | null>;
  noterIdempotence(compteId: number, cle: string, conversationId: number, maintenant: Date): Promise<boolean>;
}

/** Lire sans transaction, ou écrire dans une seule transaction */
export type DepotMessagerie = {
  lire: TablesMessagerie;
  ecrire: <T>(geste: (t: TablesMessagerie) => Promise<T>) => Promise<T>;
  /**
   * Après une transaction validée : supprime du disque ces photos et notes vocales, SAUF celles qu'un signalement garde
   * (ouvert, ou jugé depuis moins de 183 jours : supprimerMediasLibres du socle) ; rend le nombre supprimé, sans jamais lever
   * d'erreur
   */
  supprimerFichiers: (fichiers: readonly string[]) => Promise<number>;
};

/** Ce que les règles de la messagerie reçoivent du socle */
export type ContexteMessagerie = {
  depot: DepotMessagerie;
  relations: RelationsSociales;
  /** null : clé des données absente (les routes 🔐 ont déjà répondu 503) */
  chiffrement: ChiffrementSocial | null;
  medias: StockageMediasChat;
  gif?: ClientGif | null;
};

/** Un message que tu peux voir (B.0) : de cette conversation, dont tu es membre, après ton arrivée, d'un auteur sans blocage */
export type MessageVisible = { message: LigneMessage; conversation: LigneConversation; membre: LigneMembre };
/** La règle d'accès de B.0 ; null : le message n'existe pas pour toi. Sert aussi aux signalements de messages (lot L6) */
export type LireMessageVisible = (compteId: number, conversationId: number, messageId: number) => Promise<MessageVisible | null>;

export type MessageAEnvoyer = { idClient: string; reponseA?: number } & (
  | { type: "texte"; texte: string }
  | { type: "lieu"; lieuId: number; texte: string | null }
  | { type: "vote"; lieux: number[]; finLe: Date }
  | { type: "gif"; gifId: string });
export type MediaRecu = { idClient: string } & (
  | { type: "photo"; octets: Buffer; largeur: number; hauteur: number; album?: string | null; legende?: string | null }
  | { type: "vocal"; octets: Buffer; dureeSecondes: number; onde?: string | null });

/** « id-client-pris » : ce idClient a déjà servi à quelqu'un d'autre dans cette conversation (400 champ-invalide idClient) */
export type RefusEnvoi =
  | "conversation-inconnue" | "conversation-fermee" | "lieu-inconnu" | "trop-de-medias" | "stockage-plein" | "id-client-pris"
  | "reponse-introuvable" | "album-plein" | "album-invalide" | "reserve-aux-groupes" | "gif-refuse" | "gif-inconnu" | "gif-indisponible";
/** rejoue : même idClient déjà reçu (200, aucun effet) */
export type ResultatEnvoi =
  | { ok: true; message: MessageApi; version: number; rejoue: boolean; effets: EffetSocial[] }
  | { ok: false; erreur: RefusEnvoi };

export type RefusGroupe =
  | "conversation-inconnue" | "geree-par-la-sortie" | "reserve-aux-admins" | "pas-dans-la-bande" | "groupe-plein"
  | "personne-inconnue" | "invitation-inconnue" | "id-client-pris";
type Refus<E extends string> = { ok: false; erreur: E };

export type RefusModification = "message-inconnu" | "pas-l-auteur" | "trop-tard" | "non-modifiable" | "conversation-fermee";
export type RefusPhotoGroupe = "conversation-inconnue" | "geree-par-la-sortie" | "reserve-aux-admins" | "trop-de-medias" | "stockage-plein";

export type LectureFil = FilMessagesApi | { inchange: true; version: number } | { invitation: InvitationGroupeApi };

export type RefusVote = "message-inconnu" | "conversation-fermee" | "sondage-clos" | "option-inconnue";

export type BilanTachesMessagerie = { sondages: number; rappels: number; echecs: number; effets: EffetSocial[] };

export interface ServicesMessagerie {
  listerConversations(compteId: number, apres: string | null, maintenant: Date): Promise<PageConversationsApi>;
  /** null : la conversation n'existe pas pour toi ; { invitation } : tu es invité dans ce groupe, pas encore membre */
  lireFil(compteId: number, conversationId: number, o: { version: number | null; avant: number | null }, maintenant: Date): Promise<LectureFil | null>;
  ouvrirPrive(compteId: number, autreId: number, maintenant: Date): Promise<{ ok: true; conversation: ConversationApi; cree: boolean } | Refus<"pas-dans-la-bande">>;
  /** cle : Idempotency-Key ; invites : chacun reçoit une invitation à accepter ; ignores : pas de ta bande, ou bloqués */
  creerGroupe(compteId: number, g: { titre: string; emoji: string; invites: number[] }, cle: string, maintenant: Date): Promise<
    { ok: true; conversation: ConversationApi; cree: boolean; ignores: number[]; effets: EffetSocial[] } | Refus<RefusGroupe>>;
  /** Groupes seulement (privé : conversation-inconnue ; sortie : geree-par-la-sortie), admins */
  modifierGroupe(compteId: number, conversationId: number, m: { titre?: string; emoji?: string }, maintenant: Date): Promise<
    { ok: true; conversation: ConversationApi } | Refus<RefusGroupe>>;
  /** Un admin invite des potes de SA bande ; ignorés sans le dire : déjà membres ou invités (refus compris), partis d'eux-mêmes
   *  il y a moins de 30 jours, hors de sa bande ou bloqués */
  inviter(compteId: number, conversationId: number, invites: number[], maintenant: Date): Promise<
    { ok: true; conversation: ConversationApi; ignores: number[]; effets: EffetSocial[] } | Refus<RefusGroupe>>;
  /** Oui : on devient membre (la suite, pas l'historique) ; non : refus noté, en silence */
  repondreInvitation(compteId: number, conversationId: number, rejoint: boolean, maintenant: Date): Promise<
    { ok: true; conversation: ConversationApi | null } | Refus<"invitation-inconnue">>;
  /** "moi" : quitter (DepartGroupe) ; sinon un admin retire un membre ou une invitation en attente, sans prévenir */
  retirerMembre(compteId: number, conversationId: number, membre: number | "moi", maintenant: Date): Promise<{ ok: true } | Refus<RefusGroupe>>;
  changerRole(compteId: number, conversationId: number, membre: number, role: RoleConversation, maintenant: Date): Promise<
    { ok: true; conversation: ConversationApi } | Refus<RefusGroupe>>;
  /** Faux : la conversation n'existe pas pour toi */
  couper(compteId: number, conversationId: number, coupee: boolean): Promise<boolean>;
  marquerLu(compteId: number, conversationId: number, jusqua: number, maintenant: Date): Promise<boolean>;
  epingler(compteId: number, conversationId: number, epinglee: boolean, maintenant: Date): Promise<
    { ok: true } | Refus<"conversation-inconnue" | "geree-par-la-sortie" | "trop-d-epinglees">>;
  effacerPourMoi(compteId: number, conversationId: number): Promise<boolean>;
  envoyer(compteId: number, conversationId: number, message: MessageAEnvoyer, maintenant: Date): Promise<ResultatEnvoi>;
  verifierEnvoiMedia(compteId: number, conversationId: number, idClient: string, taille: number, maintenant: Date): Promise<"ok" | RefusEnvoi>;
  envoyerMedia(compteId: number, conversationId: number, media: MediaRecu, maintenant: Date): Promise<ResultatEnvoi>;
  /** null : message inconnu pour toi ; "expire" : expiré, supprimé, suspendu ou retiré, même gardé pour la modération */
  lireMedia(compteId: number, conversationId: number, messageId: number, maintenant: Date): Promise<{ octets: Buffer; typeMime: string } | "expire" | null>;
  supprimerMessage(compteId: number, conversationId: number, messageId: number, maintenant: Date): Promise<
    { ok: true; version: number } | Refus<"message-inconnu" | "reserve-a-l-auteur">>;
  modifierMessage(compteId: number, conversationId: number, messageId: number, texte: string, maintenant: Date): Promise<
    { ok: true; message: MessageApi; version: number } | Refus<RefusModification>>;
  poserMessageSysteme(conversationId: number, systeme: string, texte: string, maintenant: Date): Promise<{ messageId: number; version: number } | null>;
  verifierPhotoGroupe(compteId: number, conversationId: number, taille: number, maintenant: Date): Promise<"ok" | RefusPhotoGroupe>;
  changerPhotoGroupe(compteId: number, conversationId: number, octets: Buffer | null, maintenant: Date): Promise<
    { ok: true; conversation: ConversationApi } | Refus<RefusPhotoGroupe>>;
  lirePhotoGroupe(compteId: number, conversationId: number): Promise<{ octets: Buffer } | "absente" | null>;
  listerPartages(compteId: number, conversationId: number, type: TypePartage, avant: number | null, maintenant: Date): Promise<PagePartagesApi | null>;
  basculerReaction(compteId: number, conversationId: number, messageId: number, reaction: CodeReaction, oui: boolean, maintenant: Date): Promise<
    { ok: true; version: number } | Refus<"message-inconnu" | "conversation-fermee">>;
  voterSondage(compteId: number, conversationId: number, messageId: number, ordre: number | null, maintenant: Date): Promise<
    { ok: true; message: MessageApi; version: number } | Refus<RefusVote>>;
  passerTaches(maintenant: Date): Promise<BilanTachesMessagerie>;
  envoyerLieu(compteId: number, idClient: string, lieuId: number, a: number[], mot: string | null, maintenant: Date): Promise<
    { ok: true; envoyes: LieuEnvoyeApi[]; ignores: number[]; rejoue: boolean; effets: EffetSocial[] } | Refus<"lieu-inconnu" | "pas-dans-la-bande" | "id-client-pris">>;
  listerLieuxRecus(compteId: number, apres: string | null): Promise<{ lieux: LieuEnvoyeApi[]; suite: string | null }>;
  listerLieuxEnvoyes(compteId: number, apres: string | null): Promise<{ lieux: LieuEnvoyeApi[]; suite: string | null }>;
  marquerLieuxVus(compteId: number, jusqua: number): Promise<void>;
  lireMessageVisible: LireMessageVisible;
}
