// Effacer des conversations (spécification sociale D.1) : une seule fonction pour l'annulation d'une sortie, le dernier
// départ d'un groupe ou d'une sortie, et les étapes 2 et 3 du ménage de nuit (conversations d'un an sans message, et
// conversations vides). DANS la transaction de l'appelant : les lignes des conversations sont verrouillées (dans l'ordre
// des id, contre les interblocages ; un message qui arrive attend, puis trouve la conversation absente : 404 ; l'appelant
// qui touche des sorties a verrouillé les sorties AVANT, comme sorties.ts et le ménage de nuit), les fichiers
// de leurs messages sont lus, puis les conversations effacées : la base efface en cascade membres, invitations, messages,
// réactions, départs, et la sortie avec ses invitations, propositions et votes. APRÈS la transaction (apresTransaction) :
// les photos et notes vocales partent du disque, SAUF celles qu'un signalement ouvert garde (fichier_media, A.7). Les
// signalements et leurs instantanés restent : la preuve ne disparaît pas.
import { Prisma, type PrismaClient } from "../base-de-donnees/client-genere/client.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

type ClientTransaction = Pick<Prisma.TransactionClient, "$queryRaw" | "conversation" | "messageConversation">;
type ClientSignalements = Pick<PrismaClient, "signalement">;

const TAILLE_PAQUET_FICHIERS = 500;

/**
 * Signalement « ouvert » (E.1, filtre CONTESTES de la modération) : pas encore jugé, ou contesté et pas encore réexaminé.
 * Son fichier reste sur le disque, même si le message, la conversation ou le compte de l'auteur ont disparu.
 */
export const SIGNALEMENT_OUVERT: Prisma.SignalementWhereInput = {
  OR: [{ statut: "a-traiter" }, { contesteLe: { not: null }, reexamineLe: null }],
};

export type ConversationsEffacees = {
  /** Conversations vraiment effacées (celles déjà parties ne comptent pas) */
  conversations: number;
  /** Les fichiers de leurs messages, déjà oubliés par la base */
  fichiers: string[];
  /**
   * À appeler une fois la transaction VALIDÉE : supprime du disque les fichiers qu'aucun signalement ouvert ne garde, et rend
   * leur nombre. Ne lève jamais d'erreur (un fichier resté est un orphelin, que le ménage de nuit supprime après 24 h).
   * `base` : la connexion de l'API par défaut.
   */
  apresTransaction: (base?: ClientSignalements) => Promise<number>;
};

export async function effacerConversations(tx: ClientTransaction, ids: readonly number[], medias: StockageMediasChat): Promise<ConversationsEffacees> {
  const cibles = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
  if (cibles.length === 0) return { conversations: 0, fichiers: [], apresTransaction: async () => 0 };
  await tx.$queryRaw`SELECT id FROM conversations WHERE id IN (${Prisma.join(cibles)}) ORDER BY id FOR UPDATE`;
  const lignes = await tx.messageConversation.findMany({
    where: { conversationId: { in: cibles }, fichier: { not: null } },
    select: { fichier: true },
  });
  const { count } = await tx.conversation.deleteMany({ where: { id: { in: cibles } } });
  const fichiers = lignes.flatMap(({ fichier }) => (fichier ? [fichier] : []));
  return { conversations: count, fichiers, apresTransaction: (base) => supprimerMediasLibres(fichiers, medias, base) };
}

/**
 * Supprime du disque ces fichiers de médias, sauf ceux qu'un signalement ouvert garde ; rend le nombre supprimé. Hors de
 * toute transaction, une fois la base à jour. Ne lève jamais d'erreur : ce qui reste sera un orphelin du ménage de nuit.
 */
export async function supprimerMediasLibres(fichiers: readonly string[], medias: StockageMediasChat, base?: ClientSignalements): Promise<number> {
  if (fichiers.length === 0) return 0;
  let supprimes = 0;
  try {
    const depot = base ?? (await import("../base-de-donnees/connexion.ts")).baseDeDonnees;
    const tous = [...new Set(fichiers)];
    for (let debut = 0; debut < tous.length; debut += TAILLE_PAQUET_FICHIERS) {
      const paquet = tous.slice(debut, debut + TAILLE_PAQUET_FICHIERS);
      const gardes = await depot.signalement.findMany({
        where: { AND: [{ fichierMedia: { in: paquet } }, SIGNALEMENT_OUVERT] },
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
