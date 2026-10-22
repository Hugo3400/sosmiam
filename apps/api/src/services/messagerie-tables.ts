// Les gestes élémentaires de la messagerie dans la base (contrat dans messagerie-regles.ts) : conversations, membres,
// invitations aux groupes, départs, bande et verrous ; les messages sont dans messagerie-tables-messages.ts. Aucune règle ici :
// elles sont écrites une fois, au-dessus (messagerie.ts). Dans `ecrire`, tout passe par la même transaction : les verrous
// (SELECT … FOR UPDATE, ou FOR NO KEY UPDATE pour les comptes) tiennent jusqu'à la fin, et les insertions en double (ON CONFLICT DO NOTHING) ne la font jamais échouer.
import type { RoleConversation, TypeConversation } from "../../../../packages/commun/src/types/messagerie.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { effacerConversations, supprimerMediasLibres } from "./effacer-conversations.ts";
import { creerTablesMessages } from "./messagerie-tables-messages.ts";
import { creerTablesSondages } from "./messagerie-tables-sondages.ts";
import type { DepotMessagerie, LigneConversation, LigneInvitationGroupe, LigneMembre, TablesMessagerie } from "./messagerie-regles.ts";
import type { RelationsSociales, TransactionSociale } from "./relations-sociales-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

type Client = Prisma.TransactionClient;

/** Une transaction de la messagerie peut écrire une photo de 5 Mo sur le disque : un peu plus que les 5 s par défaut */
const DELAIS_TRANSACTION = { maxWait: 5_000, timeout: 15_000 };

const CHAMPS_CONVERSATION = {
  id: true, type: true, clePrive: true, titreChiffre: true, emoji: true, creeParId: true, version: true, dernierMessageLe: true,
  modifieLe: true, creeLe: true, photo: true, sortie: { select: { id: true, titre: true, emoji: true } },
} as const satisfies Prisma.ConversationSelect;

type ConversationLue = Prisma.ConversationGetPayload<{ select: typeof CHAMPS_CONVERSATION }>;
const versConversation = (c: ConversationLue): LigneConversation => ({ ...c, type: c.type as TypeConversation, sortie: c.sortie ?? null });
const versMembre = (m: Omit<LigneMembre, "role"> & { role: string }): LigneMembre => ({ ...m, role: m.role as RoleConversation });
const versInvitation = (i: Omit<LigneInvitationGroupe, "statut"> & { statut: string }): LigneInvitationGroupe => ({ ...i, statut: i.statut === "refuse" ? "refuse" : "invite" });

/** Les gestes sur `base` : la connexion de l'API (lectures), ou la transaction ouverte par ecrire (`tx`) */
export function creerTablesMessagerie(base: Client, relations: RelationsSociales, medias: StockageMediasChat, tx?: TransactionSociale): TablesMessagerie {
  return {
    ...creerTablesMessages(base),
    ...creerTablesSondages(base),

    async lireConversations(ids) {
      if (ids.length === 0) return new Map();
      const lignes = await base.conversation.findMany({ where: { id: { in: [...new Set(ids)] } }, select: CHAMPS_CONVERSATION });
      return new Map(lignes.map((c) => [c.id, versConversation(c)]));
    },
    async lireConversationPrivee(clePrive) {
      const c = await base.conversation.findUnique({ where: { clePrive }, select: CHAMPS_CONVERSATION });
      return c ? versConversation(c) : null;
    },
    async listerMesConversations(compteId, apres, nombre) {
      const lignes = await base.conversation.findMany({
        where: {
          type: { in: ["prive", "groupe"] },
          membres: { some: { compteId } },
          ...(apres ? { OR: [{ dernierMessageLe: { lt: apres.date } }, { dernierMessageLe: apres.date, id: { lt: apres.id } }] } : {}),
        },
        orderBy: [{ dernierMessageLe: "desc" }, { id: "desc" }],
        take: nombre,
        select: CHAMPS_CONVERSATION,
      });
      return lignes.map(versConversation);
    },
    async verrouillerConversation(id) {
      const lignes = await base.$queryRaw<{ id: number }[]>`SELECT id FROM conversations WHERE id = ${id} FOR UPDATE`;
      return lignes.length > 0;
    },
    async toucherConversation(id, maintenant, message) {
      const lignes = message
        ? await base.$queryRaw<{ version: number }[]>`
            UPDATE conversations SET version = version + 1, modifie_le = ${maintenant}::timestamptz, dernier_message_le = ${maintenant}::timestamptz
            WHERE id = ${id} RETURNING version`
        : await base.$queryRaw<{ version: number }[]>`
            UPDATE conversations SET version = version + 1, modifie_le = ${maintenant}::timestamptz WHERE id = ${id} RETURNING version`;
      return lignes[0] ? Number(lignes[0].version) : null;
    },
    async creerConversation(c) {
      const [ligne] = await base.conversation.createManyAndReturn({
        data: [{ type: c.type, clePrive: c.clePrive, emoji: c.emoji, creeParId: c.creeParId, dernierMessageLe: c.maintenant, modifieLe: c.maintenant, creeLe: c.maintenant }],
        skipDuplicates: true,
        select: { id: true },
      });
      return ligne?.id ?? null;
    },
    async ecrireGroupe(id, m) {
      if (m.titreChiffre === undefined && m.emoji === undefined && m.photo === undefined) return;
      await base.conversation.update({ where: { id }, data: m });
    },
    effacerConversations: (ids) => effacerConversations(base, ids, medias),

    async lireMembres(conversationIds) {
      if (conversationIds.length === 0) return [];
      const lignes = await base.membreConversation.findMany({ where: { conversationId: { in: [...new Set(conversationIds)] } } });
      return lignes.map(versMembre);
    },
    async ajouterMembre(m) {
      await base.membreConversation.createMany({ data: [m], skipDuplicates: true });
    },
    async modifierMembre(conversationId, compteId, m) {
      return (await base.membreConversation.updateMany({ where: { conversationId, compteId }, data: m })).count > 0;
    },
    async avancerMembre(conversationId, compteId, m) {
      if (m.luJusqua !== undefined) {
        await base.membreConversation.updateMany({
          where: { conversationId, compteId, luJusqua: { lt: m.luJusqua } },
          data: { luJusqua: m.luJusqua, ...(m.luLe !== undefined ? { luLe: m.luLe } : {}) },
        });
      }
      if (m.visibleApres !== undefined) {
        await base.membreConversation.updateMany({ where: { conversationId, compteId, visibleApres: { lt: m.visibleApres } }, data: { visibleApres: m.visibleApres } });
      }
    },
    async retirerMembre(conversationId, compteId) {
      await base.membreConversation.deleteMany({ where: { conversationId, compteId } });
    },
    async listerMesEpinglees(compteId) {
      const lignes = await base.membreConversation.findMany({
        where: { compteId, epingleeLe: { not: null }, conversation: { type: { in: ["prive", "groupe"] } } },
        orderBy: [{ epingleeLe: "desc" }, { conversationId: "desc" }],
        select: { conversation: { select: CHAMPS_CONVERSATION } },
      });
      return lignes.map((l) => versConversation(l.conversation));
    },
    async compterEpinglees(compteId) {
      return base.membreConversation.count({ where: { compteId, epingleeLe: { not: null } } });
    },
    async lireAccusesLecture(compteIds) {
      if (compteIds.length === 0) return new Set();
      const lignes = await base.profilSocial.findMany({ where: { compteId: { in: [...new Set(compteIds)] }, accusesLecture: true }, select: { compteId: true } });
      return new Set(lignes.map((l) => l.compteId));
    },

    async lireInvitations(conversationIds) {
      if (conversationIds.length === 0) return [];
      const lignes = await base.invitationGroupe.findMany({ where: { conversationId: { in: [...new Set(conversationIds)] } }, orderBy: [{ creeLe: "asc" }, { compteId: "asc" }] });
      return lignes.map(versInvitation);
    },
    async listerMesInvitations(compteId, nombre) {
      const lignes = await base.invitationGroupe.findMany({ where: { compteId, statut: "invite" }, orderBy: [{ creeLe: "desc" }, { conversationId: "desc" }], take: nombre });
      return lignes.map(versInvitation);
    },
    async creerInvitations(lignes) {
      if (lignes.length > 0) await base.invitationGroupe.createMany({ data: [...lignes], skipDuplicates: true });
    },
    async refuserInvitation(conversationId, compteId, maintenant) {
      await base.invitationGroupe.updateMany({ where: { conversationId, compteId, statut: "invite" }, data: { statut: "refuse", reponduLe: maintenant } });
    },
    async supprimerInvitation(conversationId, compteId) {
      return (await base.invitationGroupe.deleteMany({ where: { conversationId, compteId } })).count > 0;
    },

    async lireDeparts(conversationId, depuis) {
      const lignes = await base.departGroupe.findMany({ where: { conversationId, partiLe: { gt: depuis } }, select: { compteId: true } });
      return new Set(lignes.map((l) => l.compteId));
    },
    async noterDepart(conversationId, compteId, maintenant) {
      await base.departGroupe.upsert({
        where: { conversationId_compteId: { conversationId, compteId } },
        create: { conversationId, compteId, partiLe: maintenant },
        update: { partiLe: maintenant },
      });
    },
    async oublierDepart(conversationId, compteId) {
      await base.departGroupe.deleteMany({ where: { conversationId, compteId } });
    },

    async listerPotesParmi(compteId, ids) {
      if (ids.length === 0) return new Set();
      const lignes = await base.membreBande.findMany({ where: { compteId, poteId: { in: [...new Set(ids)] } }, select: { poteId: true } });
      return new Set(lignes.map((l) => l.poteId));
    },
    bloqueEntre: (a, b) => relations.bloqueEntre(a, b, tx),
    // FOR NO KEY UPDATE, dans l'ordre des id, avant la conversation (comme les sorties) : deux envois de médias du même compte
    // s'attendent, un geste de la bande ou un blocage (FOR UPDATE) aussi ; mais les clés étrangères (auteur_id, compte_id…)
    // d'un message écrit au même moment sous le seul verrou de sa conversation (FOR KEY SHARE) passent : jamais d'interblocage
    verrouillerComptes: async (ids) => {
      const tries = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
      if (tx && tries.length > 0) await base.$queryRaw`SELECT id FROM comptes WHERE id IN (${Prisma.join(tries)}) ORDER BY id FOR NO KEY UPDATE`;
    },
    lireIdempotence: (compteId, cle) => relations.lireIdempotence(compteId, cle, "groupe", tx),
    noterIdempotence: (compteId, cle, conversationId, maintenant) => relations.noterIdempotence(compteId, cle, "groupe", conversationId, maintenant, tx),
  };
}

/** Le dépôt de la messagerie dans la base : lectures sur la connexion de l'API, écritures dans une transaction */
export function creerDepotMessagerie(o: { relations: RelationsSociales; medias: StockageMediasChat; base?: typeof baseDeDonnees }): DepotMessagerie {
  const base = o.base ?? baseDeDonnees;
  return {
    lire: creerTablesMessagerie(base, o.relations, o.medias),
    ecrire: (geste) => base.$transaction((tx) => geste(creerTablesMessagerie(tx, o.relations, o.medias, tx)), DELAIS_TRANSACTION),
    supprimerFichiers: (fichiers) => supprimerMediasLibres(fichiers, o.medias, base),
  };
}
