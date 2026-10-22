import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import type { LigneRappelSortie, LigneSondage, TablesMessagerie } from "./messagerie-regles.ts";

type Client = Prisma.TransactionClient;

export type TablesSondages = Pick<TablesMessagerie,
  | "creerSondage" | "lireSondages" | "voterSondage" | "retirerVoteSondage" | "supprimerSondage" | "listerSondagesEchus" | "cloreSondage"
  | "lireNomsLieux" | "listerSortiesARappeler" | "prendreRappelSortie" | "lireParticipantsSortie">;

type RappelBrut = { id: number; conversationId: number; titre: string; quand: Date | string; creeLe: Date | string };

export function creerTablesSondages(base: Client): TablesSondages {
  return {
    async creerSondage(s) {
      await base.sondageMessage.create({
        data: { messageId: s.messageId, finLe: s.finLe, options: { create: s.options.map((o) => ({ ordre: o.ordre, lieuChiffre: o.lieuChiffre })) } },
        select: { messageId: true },
      });
    },
    async lireSondages(messageIds) {
      if (messageIds.length === 0) return new Map();
      const lignes = await base.sondageMessage.findMany({
        where: { messageId: { in: [...new Set(messageIds)] } },
        select: {
          messageId: true, finLe: true, closLe: true, gagnant: true,
          options: { select: { id: true, ordre: true, lieuChiffre: true }, orderBy: { ordre: "asc" } },
          votes: { select: { compteId: true, option: { select: { ordre: true } } }, orderBy: { compteId: "asc" } },
        },
      });
      return new Map(lignes.map((l): [number, LigneSondage] => [l.messageId, {
        ...l, votes: l.votes.map((v) => ({ compteId: v.compteId, ordre: v.option.ordre })),
      }]));
    },
    async voterSondage(messageId, compteId, ordre, maintenant) {
      const lignes = await base.$queryRaw<{ n: number }[]>`
        INSERT INTO votes_sondages (message_id, compte_id, option_id, vote_le)
        SELECT o.message_id, ${compteId}::int, o.id, ${maintenant}::timestamptz FROM options_sondages o
        WHERE o.message_id = ${messageId}::int AND o.ordre = ${ordre}::smallint
        ON CONFLICT (message_id, compte_id) DO UPDATE SET option_id = EXCLUDED.option_id, vote_le = EXCLUDED.vote_le
        WHERE votes_sondages.option_id <> EXCLUDED.option_id
        RETURNING 1 AS n`;
      return lignes.length > 0;
    },
    async retirerVoteSondage(messageId, compteId) {
      return (await base.voteSondage.deleteMany({ where: { messageId, compteId } })).count > 0;
    },
    async supprimerSondage(messageId) {
      await base.sondageMessage.deleteMany({ where: { messageId } });
    },
    async listerSondagesEchus(maintenant, nombre) {
      const lignes = await base.sondageMessage.findMany({
        where: { closLe: null, finLe: { lte: maintenant } },
        select: { messageId: true, message: { select: { conversationId: true } } },
        orderBy: [{ finLe: "asc" }, { messageId: "asc" }],
        take: nombre,
      });
      return lignes.map((l) => ({ messageId: l.messageId, conversationId: l.message.conversationId }));
    },
    async cloreSondage(messageId, gagnant, maintenant) {
      return (await base.sondageMessage.updateMany({ where: { messageId, closLe: null }, data: { closLe: maintenant, gagnant } })).count > 0;
    },
    async lireNomsLieux(ids) {
      if (ids.length === 0) return new Map();
      const lignes = await base.lieu.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, nom: true } });
      return new Map(lignes.map((l) => [l.id, l.nom]));
    },
    async listerSortiesARappeler(apres, jusqua, nombre) {
      const lignes = await base.sortie.findMany({
        where: { rappelEnvoyeLe: null, voteTermineLe: { not: null }, quand: { gt: apres, lte: jusqua } },
        select: { id: true },
        orderBy: [{ quand: "asc" }, { id: "asc" }],
        take: nombre,
      });
      return lignes.map((l) => l.id);
    },
    async prendreRappelSortie(sortieId, apres, jusqua, maintenant): Promise<LigneRappelSortie | null> {
      const [ligne] = await base.$queryRaw<RappelBrut[]>`
        UPDATE sorties SET rappel_envoye_le = ${maintenant}::timestamptz
        WHERE id = ${sortieId}::int AND rappel_envoye_le IS NULL AND vote_termine_le IS NOT NULL
          AND quand > ${apres}::timestamptz AND quand <= ${jusqua}::timestamptz
        RETURNING id, conversation_id AS "conversationId", titre, quand, cree_le AS "creeLe"`;
      if (!ligne) return null;
      return { id: Number(ligne.id), conversationId: Number(ligne.conversationId), titre: ligne.titre, quand: new Date(ligne.quand), creeLe: new Date(ligne.creeLe) };
    },
    async lireParticipantsSortie(sortieId) {
      const lignes = await base.invitationSortie.findMany({ where: { sortieId, statut: "accepte" }, select: { compteId: true }, orderBy: { compteId: "asc" } });
      return lignes.map((l) => l.compteId);
    },
  };
}
