// Les étapes 1 à 8 du ménage social de la nuit (spécification sociale E.1), une fonction par étape, appelées dans l'ordre par
// menage-social.ts. Chaque étape travaille par paquets de 500, en boucle tant qu'il en reste. Règle commune : rien de ce qui
// touche un signalement OUVERT (pas encore jugé, ou contesté et pas encore réexaminé : SIGNALEMENT_OUVERT, le filtre
// CONTESTES de la modération) ne part : ni le média d'un message signalé, ni sa conversation, ni un contenu retiré dont la
// décision est contestée. Les fichiers passent par StockageMediasChat, et seulement après la mise à jour de la base
// (supprimerMediasLibres : un fichier qu'un signalement ouvert garde reste sur le disque). Jamais un contenu dans le journal.
import { MAX_NOTIFICATIONS_CLOCHE, TYPES_CLOCHE_MODERATION } from "../../../../packages/commun/src/regles/cloche.ts";
import { Prisma, type PrismaClient } from "../base-de-donnees/client-genere/client.ts";
import type { SeuilsMenageSocial } from "../fonctions/social/calculer-seuils-menage-social.ts";
import { effacerConversations, SIGNALEMENT_OUVERT, supprimerMediasLibres } from "./effacer-conversations.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

export const TAILLE_PAQUET_MENAGE = 500;
/** Une transaction du ménage efface jusqu'à 500 conversations, avec leurs messages en cascade */
const DELAIS_TRANSACTION = { maxWait: 10_000, timeout: 120_000 };

/** La base du ménage : la connexion de l'API, ou celle d'un essai */
export type BaseMenage = PrismaClient;

/** Le signalement `s` est ouvert (E.1) : pas encore jugé, ou contesté et pas encore réexaminé */
const ouvert = (s: string) => Prisma.raw(`(${s}.statut = 'a-traiter' OR (${s}.conteste_le IS NOT NULL AND ${s}.reexamine_le IS NULL))`);
/** Aucun message de la conversation `c` n'attend la modération */
const SANS_MESSAGE_SIGNALE = Prisma.sql`NOT EXISTS (
  SELECT 1 FROM messages_conversations m JOIN signalements sg ON sg.cible = 'message' AND sg.cible_id = m.id::text
  WHERE m.conversation_id = c.id AND ${ouvert("sg")})`;
/** Aucun signalement ouvert sur ce contenu (`cible` : « message », « commentaire », « liste » ; `id` : sa colonne) */
const sansSignalementOuvert = (cible: string, id: string) =>
  Prisma.sql`NOT EXISTS (SELECT 1 FROM signalements sg WHERE sg.cible = ${cible} AND sg.cible_id = ${Prisma.raw(id)}::text AND ${ouvert("sg")})`;
const date = (d: Date) => Prisma.sql`${d.toISOString()}::timestamptz`;

/**
 * DELETE par paquets de 500 dans une table (nom constant, jamais venu de dehors), tant qu'il en reste ; rend le nombre de
 * lignes effacées. Par ctid : la plupart de ces tables ont une clé en deux colonnes.
 */
async function effacerParPaquets(base: BaseMenage, table: string, condition: Prisma.Sql): Promise<number> {
  const t = Prisma.raw(table);
  let total = 0;
  for (;;) {
    const effaces = await base.$executeRaw`DELETE FROM ${t} WHERE ctid IN (SELECT ctid FROM ${t} WHERE ${condition} LIMIT ${TAILLE_PAQUET_MENAGE})`;
    total += effaces;
    if (effaces < TAILLE_PAQUET_MENAGE) return total;
  }
}

/**
 * Étape 1 : photos et notes vocales dont media_expire_le est passé (90 jours après l'envoi), sauf celles d'un message au
 * signalement ouvert. `fichier` passe à NULL (typeMime, taille, durée et media_expire_le restent : l'app dit « Ce média a
 * expiré ») ; puis les fichiers partent du disque. SKIP LOCKED : un message en cours de modification attend la nuit suivante.
 */
export async function effacerMediasExpires(base: BaseMenage, seuils: SeuilsMenageSocial, medias: StockageMediasChat): Promise<number> {
  let total = 0;
  for (;;) {
    const lignes = await base.$queryRaw<{ fichier: string }[]>`
      WITH cibles AS (
        SELECT m.id, m.fichier FROM messages_conversations m
        WHERE m.media_expire_le <= ${date(seuils.medias)} AND m.fichier IS NOT NULL AND ${sansSignalementOuvert("message", "m.id")}
        ORDER BY m.id LIMIT ${TAILLE_PAQUET_MENAGE} FOR UPDATE SKIP LOCKED)
      UPDATE messages_conversations m SET fichier = NULL FROM cibles WHERE m.id = cibles.id RETURNING cibles.fichier`;
    total += lignes.length;
    await supprimerMediasLibres(lignes.map((l) => l.fichier), medias, base);
    if (lignes.length < TAILLE_PAQUET_MENAGE) return total;
  }
}

/**
 * Les conversations qui répondent à `condition` (alias c pour la conversation, s pour la sortie liée), effacées par
 * effacerConversations, par paquets de 500. Sans course : dans la transaction, les lignes sont d'abord VERROUILLÉES, puis la
 * condition est relue par une nouvelle lecture (READ COMMITTED : elle voit tout ce qui a été validé avant le verrou). Un
 * message arrivé entre-temps (il verrouille sa conversation et avance dernier_message_le), un membre entré ou un
 * signalement ouvert l'écartent ; un envoi qui attendait le verrou trouve ensuite la conversation absente (404).
 */
async function effacerConversationsSelon(base: BaseMenage, condition: Prisma.Sql, medias: StockageMediasChat): Promise<{ conversations: number; sorties: number }> {
  const bilan = { conversations: 0, sorties: 0 };
  let apres = 0;
  for (;;) {
    const candidates = await base.$queryRaw<{ id: number }[]>`
      SELECT c.id FROM conversations c LEFT JOIN sorties s ON s.conversation_id = c.id
      WHERE c.id > ${apres} AND ${condition} ORDER BY c.id LIMIT ${TAILLE_PAQUET_MENAGE}`;
    if (candidates.length === 0) return bilan;
    apres = Number(candidates.at(-1)!.id);
    const ids = candidates.map((c) => Number(c.id));
    const fait = await base.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM conversations WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;
      const toujours = await tx.$queryRaw<{ id: number; type: string }[]>`
        SELECT c.id, c.type FROM conversations c LEFT JOIN sorties s ON s.conversation_id = c.id
        WHERE c.id IN (${Prisma.join(ids)}) AND ${condition}`;
      const effacees = await effacerConversations(tx, toujours.map((c) => Number(c.id)), medias);
      return { effacees, sorties: toujours.filter((c) => c.type === "sortie").length };
    }, DELAIS_TRANSACTION);
    // La transaction est validée : les photos et vocaux partent du disque (sauf ceux qu'un signalement ouvert garde)
    await fait.effacees.apresTransaction(base);
    bilan.conversations += fait.effacees.conversations;
    bilan.sorties += fait.sorties;
    if (candidates.length < TAILLE_PAQUET_MENAGE) return bilan;
  }
}

/**
 * Étape 2 : conversations d'un an sans message. Une sortie compte depuis sa date : on garde le plus tard des deux
 * (GREATEST(dernier_message_le, COALESCE(s.quand, dernier_message_le)) < seuil, écrit ici en deux comparaisons, pour l'index).
 * Une conversation dont un message attend la modération attend avec lui (choix de construction à confirmer par Hugo) : elle
 * part la nuit qui suit la décision ; l'instantané du signalement garde de toute façon le message.
 */
export function effacerConversationsAnciennes(base: BaseMenage, seuils: SeuilsMenageSocial, medias: StockageMediasChat) {
  const seuil = date(seuils.conversations);
  return effacerConversationsSelon(base, Prisma.sql`c.dernier_message_le < ${seuil} AND (s.quand IS NULL OR s.quand < ${seuil}) AND ${SANS_MESSAGE_SIGNALE}`, medias);
}

/**
 * Étape 3 : conversations sans plus aucun membre (groupe abandonné, privé dont les deux comptes sont partis, sortie sans
 * participant), avec la même clause « aucun message au signalement ouvert » et le même verrou. Leurs invitations en attente
 * partent avec elles (cascade).
 */
export async function effacerConversationsVides(base: BaseMenage, medias: StockageMediasChat): Promise<number> {
  const condition = Prisma.sql`NOT EXISTS (SELECT 1 FROM membres_conversations mc WHERE mc.conversation_id = c.id) AND ${SANS_MESSAGE_SIGNALE}`;
  return (await effacerConversationsSelon(base, condition, medias)).conversations;
}

export type BilanDemandesSociales = {
  demandesBande: number;
  demandesSuivi: number;
  invitationsSorties: number;
  invitationsGroupes: number;
  invitationsCoAuteurs: number;
  departsGroupes: number;
  clesIdempotence: number;
};

/**
 * Étape 4 : demandes de bande de plus de 30 jours (refusées ou non) ; demandes de suivi en attente ou refusées de plus de 30
 * jours ; invitations à remplir une liste en attente ou refusées de plus de 30 jours ; invitations à un groupe en attente ou
 * refusées de plus de 30 jours (décision de Hugo du 14/10/2026 : on peut ensuite réinviter) ; invitations en attente ou
 * refusées d'une sortie passée ; départs volontaires d'un groupe de plus de 30 jours ; clés d'idempotence de plus de 24 h.
 * (Pas de table des envois sous anti-spam : elle a été abandonnée, I.15 a.)
 */
export async function effacerDemandesExpirees(base: BaseMenage, seuils: SeuilsMenageSocial): Promise<BilanDemandesSociales> {
  const enAttente = (statuts: string[]) => Prisma.sql`statut IN (${Prisma.join(statuts)})`;
  return {
    demandesBande: await effacerParPaquets(base, "demandes_bandes", Prisma.sql`cree_le < ${date(seuils.demandesBande)}`),
    demandesSuivi: await effacerParPaquets(base, "suivis_personnes", Prisma.sql`${enAttente(["demande", "refuse"])} AND cree_le < ${date(seuils.demandesSuivi)}`),
    invitationsSorties: await effacerParPaquets(base, "invitations_sorties",
      Prisma.sql`${enAttente(["invite", "refuse"])} AND sortie_id IN (SELECT id FROM sorties WHERE quand < ${date(seuils.sortiesPassees)})`),
    invitationsGroupes: await effacerParPaquets(base, "invitations_groupes",
      Prisma.sql`${enAttente(["invite", "refuse"])} AND cree_le < ${date(seuils.invitationsGroupes)}`),
    invitationsCoAuteurs: await effacerParPaquets(base, "co_auteurs_listes", Prisma.sql`${enAttente(["invite", "refuse"])} AND cree_le < ${date(seuils.coAuteurs)}`),
    departsGroupes: await effacerParPaquets(base, "departs_groupes", Prisma.sql`parti_le < ${date(seuils.departs)}`),
    clesIdempotence: await effacerParPaquets(base, "cles_idempotence", Prisma.sql`cree_le < ${date(seuils.cles)}`),
  };
}

/**
 * Étape 5 : la cloche. Notifications de plus de 90 jours, puis au-delà des 200 plus récentes de chaque compte, SAUF les trois
 * types de la modération (contenu-masque, contenu-retire, signalement-decide) : gardés 6 mois et hors de la limite (on peut
 * contester pendant 6 mois).
 */
export async function effacerClocheAncienne(base: BaseMenage, seuils: SeuilsMenageSocial): Promise<number> {
  const moderation = Prisma.join([...TYPES_CLOCHE_MODERATION]);
  let total = await effacerParPaquets(base, "notifications_cloche", Prisma.sql`
    (type NOT IN (${moderation}) AND cree_le < ${date(seuils.cloche)}) OR (type IN (${moderation}) AND cree_le < ${date(seuils.clocheModeration)})`);
  for (;;) {
    const effaces = await base.$executeRaw`
      DELETE FROM notifications_cloche WHERE id IN (
        SELECT id FROM (
          SELECT id, row_number() OVER (PARTITION BY compte_id ORDER BY id DESC) AS rang FROM notifications_cloche
          WHERE type NOT IN (${moderation})
        ) t WHERE t.rang > ${MAX_NOTIFICATIONS_CLOCHE} LIMIT ${TAILLE_PAQUET_MENAGE})`;
    total += effaces;
    if (effaces < TAILLE_PAQUET_MENAGE) return total;
  }
}

/** Étape 6 : éléments retirés de sa vue depuis plus de 13 mois (la plupart de leurs cibles ont disparu) */
export function effacerMasquesAnciens(base: BaseMenage, seuils: SeuilsMenageSocial): Promise<number> {
  return effacerParPaquets(base, "elements_masques", Prisma.sql`cree_le < ${date(seuils.masques)}`);
}

/**
 * Étape 7 : contenus retirés par la modération depuis plus d'un an (la durée de garde des signalements après décision), sauf
 * si la décision est contestée et pas encore réexaminée (un réexamen peut remettre le contenu en ligne) :
 * - messages : texte chiffré et fichier à NULL (le fichier part du disque) ; le message reste « retiré » ;
 * - commentaires : effacés s'ils n'ont pas de réponse ; sinon texte et mentions vidés, « Commentaire supprimé » ;
 * - listes : effacées (leurs lieux, co-auteurs et abonnés partent en cascade).
 * Puis les commentaires « supprimés » (supprime_le) qui n'ont plus ni réponse ni signalement ouvert : effacés.
 * L'étape 7 bis de la spécification (signalements jugés depuis plus d'un an) n'est PAS ici : elle appartient à la session
 * Logiciel, propriétaire de la modération (effacerSignalementsAnciens, services/gestion/moderation-sociale.ts, déjà lancée
 * par faireLeMenage dans taches/taches-de-nuit.ts).
 */
export async function effacerContenusRetires(
  base: BaseMenage, seuils: SeuilsMenageSocial, medias: StockageMediasChat, maintenant: Date,
): Promise<{ contenusRetires: number; commentairesSupprimes: number }> {
  const seuil = date(seuils.contenusRetires);
  let contenusRetires = 0;
  for (;;) {
    const lignes = await base.$queryRaw<{ fichier: string | null }[]>`
      WITH cibles AS (
        SELECT m.id, m.fichier FROM messages_conversations m
        WHERE m.retire_le < ${seuil} AND (m.texte_chiffre IS NOT NULL OR m.fichier IS NOT NULL) AND ${sansSignalementOuvert("message", "m.id")}
        ORDER BY m.id LIMIT ${TAILLE_PAQUET_MENAGE} FOR UPDATE SKIP LOCKED)
      UPDATE messages_conversations m SET texte_chiffre = NULL, fichier = NULL FROM cibles WHERE m.id = cibles.id RETURNING cibles.fichier`;
    contenusRetires += lignes.length;
    await supprimerMediasLibres(lignes.flatMap((l) => (l.fichier ? [l.fichier] : [])), medias, base);
    if (lignes.length < TAILLE_PAQUET_MENAGE) break;
  }
  const aDesReponses = Prisma.sql`EXISTS (SELECT 1 FROM commentaires_publications r WHERE r.reponse_a_id = commentaires_publications.id)`;
  const libre = sansSignalementOuvert("commentaire", "commentaires_publications.id");
  contenusRetires += await effacerParPaquets(base, "commentaires_publications", Prisma.sql`retire_le < ${seuil} AND NOT ${aDesReponses} AND ${libre}`);
  for (;;) {
    const vides = await base.$executeRaw`
      UPDATE commentaires_publications SET texte = '', mentions = '[]'::jsonb, supprime_le = COALESCE(supprime_le, ${date(maintenant)})
      WHERE id IN (
        SELECT id FROM commentaires_publications
        WHERE retire_le < ${seuil} AND (texte <> '' OR supprime_le IS NULL) AND ${aDesReponses} AND ${libre}
        LIMIT ${TAILLE_PAQUET_MENAGE})`;
    contenusRetires += vides;
    if (vides < TAILLE_PAQUET_MENAGE) break;
  }
  contenusRetires += await effacerParPaquets(base, "listes_lieux", Prisma.sql`retiree_le < ${seuil} AND ${sansSignalementOuvert("liste", "listes_lieux.id")}`);
  const commentairesSupprimes = await effacerParPaquets(base, "commentaires_publications", Prisma.sql`supprime_le IS NOT NULL AND NOT ${aDesReponses} AND ${libre}`);
  return { contenusRetires, commentairesSupprimes };
}

/**
 * Étape 8 : les fichiers du dossier des médias de plus de 24 h que la base ne connaît plus, ni dans un message, ni dans le
 * fichier_media d'un signalement ouvert (coupure entre l'écriture en base et l'effacement sur le disque, signalement jugé…).
 * Ils sont supprimés. Les 24 h couvrent l'envoi en cours : le fichier est écrit juste avant sa ligne en base.
 */
export async function effacerFichiersOrphelins(base: BaseMenage, seuils: SeuilsMenageSocial, medias: StockageMediasChat): Promise<number> {
  let total = 0;
  let apres: string | null = null;
  for (;;) {
    const page = await medias.lister(apres, TAILLE_PAQUET_MENAGE);
    if (page.length === 0) return total;
    apres = page.at(-1)!.fichier;
    const vieux = page.filter((f) => f.modifieLe.getTime() < seuils.orphelins.getTime()).map((f) => f.fichier);
    if (vieux.length > 0) {
      const [messages, signalements] = await Promise.all([
        base.messageConversation.findMany({ where: { fichier: { in: vieux } }, select: { fichier: true } }),
        base.signalement.findMany({ where: { AND: [{ fichierMedia: { in: vieux } }, SIGNALEMENT_OUVERT] }, select: { fichierMedia: true } }),
      ]);
      const connus = new Set<string | null>([...messages.map((m) => m.fichier), ...signalements.map((s) => s.fichierMedia)]);
      total += await medias.supprimer(vieux.filter((f) => !connus.has(f)));
    }
    if (page.length < TAILLE_PAQUET_MENAGE) return total;
  }
}
