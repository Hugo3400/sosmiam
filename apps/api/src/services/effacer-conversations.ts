// Effacer des conversations (spécification sociale D.1) : une seule fonction pour l'annulation d'une sortie, le dernier
// départ d'un groupe ou d'une sortie, et les étapes 2 et 3 du ménage de nuit (conversations d'un an sans message, et
// conversations vides). DANS la transaction de l'appelant : les lignes des conversations sont verrouillées (dans l'ordre
// des id, contre les interblocages ; un message qui arrive attend, puis trouve la conversation absente : 404 ; l'appelant
// qui touche des sorties a verrouillé les sorties AVANT, comme sorties.ts et le ménage de nuit), les fichiers
// de leurs messages et la photo des groupes sont lus, puis les conversations effacées : la base efface en cascade membres, invitations, messages,
// réactions, départs, et la sortie avec ses invitations, propositions et votes. APRÈS la transaction (apresTransaction) :
// les photos et notes vocales partent du disque, SAUF celles qu'un signalement garde (fichier_media, A.7 : ouvert, ou jugé
// depuis moins de 183 jours, décision de Hugo du 15/10/2026). Les signalements et leurs instantanés restent : la preuve ne
// disparaît pas.
import { Prisma, type PrismaClient } from "../base-de-donnees/client-genere/client.ts";
import { calculerSeuilsMenageSocial } from "../fonctions/social/calculer-seuils-menage-social.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

type ClientTransaction = Pick<Prisma.TransactionClient, "$queryRaw" | "conversation" | "messageConversation">;
type ClientSignalements = Pick<PrismaClient, "signalement">;

const TAILLE_PAQUET_FICHIERS = 500;

/**
 * Signalement « ouvert » (E.1, filtre CONTESTES de la modération) : pas encore jugé, ou contesté et pas encore réexaminé.
 * La conversation de son message et le contenu retiré qu'il vise attendent la décision ; son fichier reste sur le disque,
 * même si le message, la conversation ou le compte de l'auteur ont disparu, et encore 183 jours après la décision
 * (signalementsGardantLeurFichier).
 */
export const SIGNALEMENT_OUVERT: Prisma.SignalementWhereInput = {
  OR: [{ statut: "a-traiter" }, { contesteLe: { not: null }, reexamineLe: null }],
};

/**
 * Signalement qui GARDE sur le disque le fichier qu'il cite (fichier_media), pour la modération, jusqu'à la fin du délai de
 * contestation (décision de Hugo du 15/10/2026) : ouvert (SIGNALEMENT_OUVERT), ou jugé APRÈS `seuil`, la décision ou le
 * réexamen s'il y en a eu un (COALESCE(reexamine_le, traite_le) > seuil), même retenu : un réexamen se fait avec la preuve.
 * `seuil` : SeuilsMenageSocial.fichiersSignales (maintenant − 183 jours). Même règle en mémoire : estFichierGardeParSignalement.
 * Ce filtre décide seulement du fichier : le message, lui, ne montre plus son média 90 jours après l'envoi (étape 1).
 */
export function signalementsGardantLeurFichier(seuil: Date): Prisma.SignalementWhereInput {
  return { OR: [SIGNALEMENT_OUVERT, { reexamineLe: { gt: seuil } }, { reexamineLe: null, traiteLe: { gt: seuil } }] };
}

/** Le seuil de signalementsGardantLeurFichier à cet instant (hors ménage de nuit : l'appelant n'en passe pas) */
const seuilFichiersSignales = (maintenant = new Date()) => calculerSeuilsMenageSocial(maintenant).fichiersSignales;

export type ConversationsEffacees = {
  /** Conversations vraiment effacées (celles déjà parties ne comptent pas) */
  conversations: number;
  /** Les fichiers de leurs messages et la photo des groupes, déjà oubliés par la base */
  fichiers: string[];
  /**
   * À appeler une fois la transaction VALIDÉE : supprime du disque les fichiers qu'aucun signalement ne garde
   * (signalementsGardantLeurFichier), et rend leur nombre. Ne lève jamais d'erreur (un fichier resté est un orphelin, que le
   * ménage de nuit supprime après 24 h). `base` : la connexion de l'API par défaut ; `seuil` : celui du ménage de nuit
   * (SeuilsMenageSocial.fichiersSignales), sinon maintenant − 183 jours.
   */
  apresTransaction: (base?: ClientSignalements, seuil?: Date) => Promise<number>;
};

export async function effacerConversations(tx: ClientTransaction, ids: readonly number[], medias: StockageMediasChat): Promise<ConversationsEffacees> {
  const cibles = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
  if (cibles.length === 0) return { conversations: 0, fichiers: [], apresTransaction: async () => 0 };
  const verrous = await tx.$queryRaw<{ id: number; photo?: string | null }[]>`SELECT id, photo FROM conversations WHERE id IN (${Prisma.join(cibles)}) ORDER BY id FOR UPDATE`;
  const lignes = await tx.messageConversation.findMany({
    where: { conversationId: { in: cibles }, fichier: { not: null } },
    select: { fichier: true },
  });
  const { count } = await tx.conversation.deleteMany({ where: { id: { in: cibles } } });
  const fichiers = [...lignes.flatMap(({ fichier }) => (fichier ? [fichier] : [])), ...verrous.flatMap(({ photo }) => (photo ? [photo] : []))];
  return { conversations: count, fichiers, apresTransaction: (base, seuil) => supprimerMediasLibres(fichiers, medias, base, seuil) };
}

/**
 * Supprime du disque ces fichiers de médias, sauf ceux qu'un signalement garde (ouvert, ou jugé après `seuil` :
 * signalementsGardantLeurFichier) ; rend le nombre supprimé. Hors de toute transaction, une fois la base à jour. Ne lève
 * jamais d'erreur : ce qui reste sera un orphelin du ménage de nuit. `seuil` : celui du ménage de nuit
 * (SeuilsMenageSocial.fichiersSignales) ; par défaut maintenant − 183 jours (messagerie, sorties, modération).
 */
export async function supprimerMediasLibres(
  fichiers: readonly string[], medias: StockageMediasChat, base?: ClientSignalements, seuil: Date = seuilFichiersSignales(),
): Promise<number> {
  if (fichiers.length === 0) return 0;
  let supprimes = 0;
  try {
    const depot = base ?? (await import("../base-de-donnees/connexion.ts")).baseDeDonnees;
    const tous = [...new Set(fichiers)];
    for (let debut = 0; debut < tous.length; debut += TAILLE_PAQUET_FICHIERS) {
      const paquet = tous.slice(debut, debut + TAILLE_PAQUET_FICHIERS);
      const gardes = await depot.signalement.findMany({
        where: { AND: [{ fichierMedia: { in: paquet } }, signalementsGardantLeurFichier(seuil)] },
        select: { fichierMedia: true },
      });
      const garde = new Set(gardes.map(({ fichierMedia }) => fichierMedia));
      supprimes += await medias.supprimer(paquet.filter((fichier) => !garde.has(fichier)));
    }
  } catch {
    console.error("Conversations effacées, mais des photos ou notes vocales restent sur le disque : le ménage de nuit les retirera.");
  }
  return supprimes;
}
