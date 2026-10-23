// Les gestes élémentaires de la messagerie dans la base, côté messages (contrat dans messagerie-regles.ts) : messages,
// réactions, médias et lieux envoyés. Aucune règle ici. Les quelques requêtes SQL brutes (dernier message de chaque
// conversation, non-lus, lieux envoyés) tiennent en une seule demande, chacune sur un index (conversation_id, id ;
// auteur_id, cree_le ; compte_id des membres).
import type { CodeReaction } from "../../../../packages/commun/src/types/messagerie.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import type { LigneMessage } from "../fonctions/social/presenter-message.ts";
import type { FiltreMessages, TablesMessagerie } from "./messagerie-regles.ts";

type Client = Prisma.TransactionClient;

const JOUR_MS = 24 * 60 * 60 * 1000;
/** Les médias sont gardés 90 jours : « envoyé depuis 24 h » se lit sur l'index de media_expire_le */
const DUREE_MEDIAS_MS = 90 * JOUR_MS;

/** Les colonnes d'un message, aux noms des lignes de Prisma (requêtes brutes) */
const COLONNES = Prisma.sql`m.id, m.conversation_id AS "conversationId", m.auteur_id AS "auteurId", m.type, m.id_client AS "idClient",
  m.texte_chiffre AS "texteChiffre", m.fichier, m.type_mime AS "typeMime", m.taille, m.largeur, m.hauteur,
  m.duree_secondes AS "dureeSecondes", m.media_expire_le AS "mediaExpireLe", m.cree_le AS "creeLe", m.supprime_le AS "supprimeLe",
  m.suspendu_le AS "suspenduLe", m.retire_le AS "retireLe", m.reponse_a_id AS "reponseAId", m.modifie_le AS "modifieLe", m.album,
  m.onde, m.systeme`;

type LigneBrute = Omit<LigneMessage, "mediaExpireLe" | "creeLe" | "supprimeLe" | "suspenduLe" | "retireLe" | "modifieLe" | "type"> & {
  type: string;
  mediaExpireLe: Date | string | null;
  creeLe: Date | string;
  supprimeLe: Date | string | null;
  suspenduLe: Date | string | null;
  retireLe: Date | string | null;
  modifieLe: Date | string | null;
};
const enDate = (d: Date | string | null) => (d === null ? null : new Date(d));
/** Une ligne brute (ou de Prisma) en LigneMessage : dates en Date, type resserré */
function convertirLigneMessage(l: LigneBrute): LigneMessage {
  return {
    ...l,
    type: l.type as LigneMessage["type"],
    mediaExpireLe: enDate(l.mediaExpireLe),
    creeLe: new Date(l.creeLe),
    supprimeLe: enDate(l.supprimeLe),
    suspenduLe: enDate(l.suspenduLe),
    retireLe: enDate(l.retireLe),
    modifieLe: enDate(l.modifieLe),
  };
}

/** Une liste d'id pour « NOT IN (…) » ; 0 (aucun compte, aucun message) quand elle est vide */
const liste = (ids: Iterable<number>) => Prisma.join([...ids].length > 0 ? [...ids] : [0]);

/** Le filtre d'un message visible : auteur sans blocage (un compte supprimé reste visible), pas signalé par moi */
const filtreVisible = (f: Omit<FiltreMessages, "apres">) => Prisma.sql`(m.auteur_id IS NULL OR m.auteur_id NOT IN (${liste(f.caches)}))
  AND m.id NOT IN (${liste(f.exclus)})${f.sansSystemes ? Prisma.sql` AND m.systeme IS NULL` : Prisma.empty}`;

const filtrePage = (f: FiltreMessages, avant: number | null): Prisma.MessageConversationWhereInput[] => [
  { id: { gt: f.apres } },
  avant === null ? {} : { id: { lt: avant } },
  f.exclus.size > 0 ? { id: { notIn: [...f.exclus] } } : {},
  f.caches.size > 0 ? { OR: [{ auteurId: null }, { auteurId: { notIn: [...f.caches] } }] } : {},
  f.sansSystemes ? { systeme: null } : {},
];

/** Lieux des privés dont je suis membre, après mon « Effacer pour moi », dans un privé sans personne de bloqué */
const lieuxDesPrives = (moi: number, caches: ReadonlySet<number>) => Prisma.sql`
  FROM messages_conversations m
  JOIN conversations c ON c.id = m.conversation_id AND c.type = 'prive'
  JOIN membres_conversations mc ON mc.conversation_id = m.conversation_id AND mc.compte_id = ${moi}
  WHERE m.type = 'lieu' AND m.id > mc.visible_apres
    AND m.supprime_le IS NULL AND m.suspendu_le IS NULL AND m.retire_le IS NULL
    AND NOT EXISTS (SELECT 1 FROM membres_conversations o WHERE o.conversation_id = m.conversation_id AND o.compte_id IN (${liste(caches)}))`;

type Messages = Pick<TablesMessagerie,
  | "lireMessage" | "lireMessages" | "lireMessageParIdClient" | "listerMessages" | "lireDerniersMessages" | "lireDerniersIds"
  | "compterNonLus" | "insererMessage" | "modifierMessage" | "lireMessagesSignales" | "lireReactions" | "basculerReaction"
  | "compterMedias" | "estLieuPublie" | "listerLieuxEnvoyes" | "lireDernierLieuRecu" | "lireLieuxVus" | "ecrireLieuxVus"
  | "listerAlbum" | "listerPartages">;

export function creerTablesMessages(base: Client): Messages {
  return {
    async lireMessage(id) {
      const l = await base.messageConversation.findUnique({ where: { id } });
      return l ? convertirLigneMessage(l) : null;
    },
    async lireMessages(ids) {
      if (ids.length === 0) return new Map();
      const lignes = await base.messageConversation.findMany({ where: { id: { in: [...new Set(ids)] } } });
      return new Map(lignes.map((l) => [l.id, convertirLigneMessage(l)]));
    },
    async lireMessageParIdClient(conversationId, idClient) {
      const l = await base.messageConversation.findUnique({ where: { conversationId_idClient: { conversationId, idClient } } });
      return l ? convertirLigneMessage(l) : null;
    },
    async listerMessages(conversationId, f, avant, nombre) {
      const lignes = await base.messageConversation.findMany({
        where: { conversationId, AND: filtrePage(f, avant) },
        orderBy: { id: "desc" },
        take: nombre,
      });
      return lignes.map(convertirLigneMessage);
    },
    async listerAlbum(conversationId, album, nombre) {
      const lignes = await base.messageConversation.findMany({ where: { conversationId, album }, orderBy: { id: "asc" }, take: nombre });
      return lignes.map(convertirLigneMessage);
    },
    async listerPartages(conversationId, type, f, avant, nombre, maintenant) {
      const lignes = await base.messageConversation.findMany({
        where: {
          conversationId, type, supprimeLe: null, suspenduLe: null, retireLe: null,
          ...(type === "photo" ? { fichier: { not: null }, mediaExpireLe: { gt: maintenant } } : {}),
          AND: filtrePage(f, avant),
        },
        orderBy: { id: "desc" },
        take: nombre,
      });
      return lignes.map(convertirLigneMessage);
    },
    async lireDerniersMessages(conversations, caches, exclus, sansSystemes = false) {
      if (conversations.length === 0) return new Map();
      const valeurs = Prisma.join(conversations.map((c) => Prisma.sql`(${c.id}::int, ${c.apres}::int)`));
      const lignes = await base.$queryRaw<LigneBrute[]>`
        SELECT ${COLONNES} FROM (VALUES ${valeurs}) AS v(cid, apres)
        CROSS JOIN LATERAL (
          SELECT * FROM messages_conversations m
          WHERE m.conversation_id = v.cid AND m.id > v.apres AND ${filtreVisible({ caches, exclus, sansSystemes })}
          ORDER BY m.id DESC LIMIT 1
        ) m`;
      return new Map(lignes.map((l) => [l.conversationId, convertirLigneMessage(l)]));
    },
    async lireDerniersIds(conversationIds, sansSystemes = false) {
      if (conversationIds.length === 0) return new Map();
      const groupes = await base.messageConversation.groupBy({
        by: ["conversationId"], where: { conversationId: { in: [...conversationIds] }, ...(sansSystemes ? { systeme: null } : {}) }, _max: { id: true },
      });
      return new Map(groupes.flatMap((g) => (g._max.id === null ? [] : [[g.conversationId, g._max.id] as const])));
    },
    async compterNonLus(moi, conversations, caches, max, sansSystemes = false) {
      if (conversations.length === 0) return new Map();
      const valeurs = Prisma.join(conversations.map((c) => Prisma.sql`(${c.id}::int, ${c.depuis}::int)`));
      const lignes = await base.$queryRaw<{ id: number; n: number }[]>`
        SELECT v.cid AS id, (
          SELECT COUNT(*) FROM (
            SELECT 1 FROM messages_conversations m
            WHERE m.conversation_id = v.cid AND m.id > v.depuis AND m.auteur_id IS DISTINCT FROM ${moi}
              AND m.supprime_le IS NULL AND m.suspendu_le IS NULL AND m.retire_le IS NULL
              AND (m.auteur_id IS NULL OR m.auteur_id NOT IN (${liste(caches)}))${sansSystemes ? Prisma.sql` AND m.systeme IS NULL` : Prisma.empty}
            LIMIT ${max}
          ) AS visibles
        )::int AS n
        FROM (VALUES ${valeurs}) AS v(cid, depuis)`;
      return new Map(lignes.map((l) => [Number(l.id), Number(l.n)]));
    },
    async insererMessage(m) {
      // ON CONFLICT DO NOTHING : un même idClient arrivé en même temps ne fait pas échouer la transaction
      const [ligne] = await base.messageConversation.createManyAndReturn({ data: [m], skipDuplicates: true });
      return ligne ? convertirLigneMessage(ligne) : null;
    },
    async modifierMessage(id, m) {
      await base.messageConversation.update({ where: { id }, data: m });
    },
    async lireMessagesSignales(compteId) {
      const lignes = await base.signalement.findMany({ where: { signaleParId: compteId, cible: "message" }, select: { cibleId: true } });
      return new Set(lignes.map((l) => Number(l.cibleId)).filter((id) => Number.isSafeInteger(id) && id > 0));
    },
    async lireReactions(messageIds) {
      if (messageIds.length === 0) return [];
      const lignes = await base.reactionMessage.findMany({
        where: { messageId: { in: [...messageIds] } },
        orderBy: [{ creeLe: "asc" }, { compteId: "asc" }],
        select: { messageId: true, compteId: true, reaction: true },
      });
      return lignes.map((l) => ({ ...l, reaction: l.reaction as CodeReaction }));
    },
    async basculerReaction(messageId, compteId, reaction, oui, maintenant) {
      if (oui) return (await base.reactionMessage.createMany({ data: [{ messageId, compteId, reaction, creeLe: maintenant }], skipDuplicates: true })).count > 0;
      return (await base.reactionMessage.deleteMany({ where: { messageId, compteId, reaction } })).count > 0;
    },
    async compterMedias(compteId, depuis) {
      const medias = { type: { in: ["photo", "vocal"] } };
      const [envoisCompte24h, compte, serveur] = await Promise.all([
        base.messageConversation.count({ where: { auteurId: compteId, ...medias, creeLe: { gte: depuis } } }),
        base.messageConversation.aggregate({ where: { auteurId: compteId, ...medias, fichier: { not: null } }, _sum: { taille: true } }),
        base.messageConversation.aggregate({ where: { mediaExpireLe: { gte: new Date(depuis.getTime() + DUREE_MEDIAS_MS) } }, _sum: { taille: true } }),
      ]);
      return { envoisCompte24h, octetsCompte: compte._sum.taille ?? 0, octetsServeur24h: serveur._sum.taille ?? 0 };
    },
    async estLieuPublie(lieuId) {
      return (await base.lieu.count({ where: { id: lieuId, statut: "publie" } })) > 0;
    },
    async listerLieuxEnvoyes(moi, sens, f, apres, nombre) {
      const qui = sens === "recus"
        ? Prisma.sql`m.auteur_id IS DISTINCT FROM ${moi} AND NOT EXISTS (
            SELECT 1 FROM elements_masques e WHERE e.compte_id = ${moi} AND e.cible = 'lieu-recu' AND e.cible_id = m.id::text)`
        : Prisma.sql`m.auteur_id = ${moi}`;
      const curseur = apres ? Prisma.sql`AND (m.cree_le, m.id) < (${apres.date}::timestamptz, ${apres.id}::int)` : Prisma.empty;
      const lignes = await base.$queryRaw<(LigneBrute & { autreId: number | null })[]>`
        SELECT ${COLONNES}, (
          SELECT o.compte_id FROM membres_conversations o WHERE o.conversation_id = m.conversation_id AND o.compte_id <> ${moi} LIMIT 1
        ) AS "autreId"
        ${lieuxDesPrives(moi, f.caches)} AND ${qui} AND ${filtreVisible(f)} ${curseur}
        ORDER BY m.cree_le DESC, m.id DESC LIMIT ${nombre}`;
      return lignes.map(({ autreId, ...l }) => ({ message: convertirLigneMessage(l), autreId: autreId === null ? null : Number(autreId) }));
    },
    async lireDernierLieuRecu(moi, jusqua, caches) {
      const [ligne] = await base.$queryRaw<{ id: number }[]>`
        SELECT m.id ${lieuxDesPrives(moi, caches)} AND m.auteur_id IS DISTINCT FROM ${moi}
          AND (m.auteur_id IS NULL OR m.auteur_id NOT IN (${liste(caches)})) AND m.id <= ${jusqua}
        ORDER BY m.id DESC LIMIT 1`;
      return ligne ? Number(ligne.id) : null;
    },
    async lireLieuxVus(compteId) {
      return (await base.profilSocial.findUnique({ where: { compteId }, select: { lieuxRecusVusJusqua: true } }))?.lieuxRecusVusJusqua ?? 0;
    },
    async ecrireLieuxVus(compteId, jusqua) {
      await base.profilSocial.updateMany({ where: { compteId, lieuxRecusVusJusqua: { lt: jusqua } }, data: { lieuxRecusVusJusqua: jusqua } });
    },
  };
}
