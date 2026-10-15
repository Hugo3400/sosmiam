import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { effacerConversations } from "./effacer-conversations.ts";
import type { NouvelleNotificationCloche } from "./effets-sociaux-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

type Transaction = Prisma.TransactionClient;

export type IssueModerationCommunaute = { notifications: NouvelleNotificationCloche[]; apresTransaction: () => Promise<void> };

const RIEN: IssueModerationCommunaute = { notifications: [], apresTransaction: async () => {} };

export async function retirerSortieMiamisDans(tx: Transaction, id: number, maintenant: Date, medias: StockageMediasChat): Promise<IssueModerationCommunaute> {
  await tx.$queryRaw`SELECT id FROM sorties_des_miamis WHERE id = ${id} FOR UPDATE`;
  const sortie = await tx.sortieDesMiamis.findUnique({
    where: { id }, select: { titre: true, conversationId: true, retireeLe: true, participations: { where: { statut: { in: ["accepte", "attente", "demande", "invite"] } }, select: { compteId: true } } },
  });
  if (!sortie || sortie.retireeLe) return RIEN;
  const efface = sortie.conversationId !== null ? await effacerConversations(tx, [sortie.conversationId], medias) : null;
  await tx.sortieDesMiamis.update({ where: { id }, data: { retireeLe: maintenant, conversationId: null, version: { increment: 1 }, modifieLe: maintenant } });
  return {
    notifications: sortie.participations.map((p) => ({ compteId: p.compteId, type: "sortie-miamis-annulee", acteurId: null, cible: { type: "miamis", id: String(id) }, detail: sortie.titre })),
    apresTransaction: async () => void (await efface?.apresTransaction(baseDeDonnees)),
  };
}

export async function appliquerDecisionCommunaute(
  tx: Transaction, s: { cible: string; cibleId: string }, decision: "retenu" | "rejete", reexamen: boolean, maintenant: Date, medias: StockageMediasChat,
): Promise<IssueModerationCommunaute> {
  const id = Number(s.cibleId);
  if (!Number.isSafeInteger(id) || id < 1) return RIEN;
  if (s.cible === "idee") {
    await tx.ideeCommunaute.updateMany({ where: { id }, data: decision === "retenu" ? { retireeLe: maintenant } : { suspendueLe: null, ...(reexamen ? { retireeLe: null } : {}) } });
  } else if (s.cible === "comment-idee") {
    await tx.commentaireIdeeCommunaute.updateMany({ where: { id }, data: decision === "retenu" ? { retireLe: maintenant } : { suspenduLe: null, ...(reexamen ? { retireLe: null } : {}) } });
  } else if (s.cible === "miamis") {
    if (decision === "retenu") return retirerSortieMiamisDans(tx, id, maintenant, medias);
    if (reexamen) await tx.sortieDesMiamis.updateMany({ where: { id }, data: { retireeLe: null, version: { increment: 1 }, modifieLe: maintenant } });
  }
  return RIEN;
}
