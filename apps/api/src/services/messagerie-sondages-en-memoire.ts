import type { LigneSondage } from "./messagerie-regles.ts";
import type { TablesSondages } from "./messagerie-tables-sondages.ts";
import { oublierSondagesEnMemoire, prendreId, type TablesSociales } from "./tables-sociales-en-memoire.ts";

export function creerTablesSondagesEnMemoire(tables: TablesSociales): TablesSondages {
  const optionsDe = (messageId: number) => [...tables.optionsSondages.values()].filter((o) => o.messageId === messageId).sort((a, b) => a.ordre - b.ordre);

  return {
    async creerSondage(s) {
      if (tables.sondages.has(s.messageId)) throw new Error("Sondage déjà créé pour ce message");
      tables.sondages.set(s.messageId, { messageId: s.messageId, finLe: s.finLe, closLe: null, gagnant: null });
      for (const o of s.options) {
        const id = prendreId(tables, "optionsSondages");
        tables.optionsSondages.set(id, { id, messageId: s.messageId, ordre: o.ordre, lieuChiffre: o.lieuChiffre });
      }
    },
    async lireSondages(messageIds) {
      return new Map(messageIds.flatMap((messageId): [number, LigneSondage][] => {
        const s = tables.sondages.get(messageId);
        if (!s) return [];
        const options = optionsDe(messageId);
        const votes = tables.votesSondages
          .filter((v) => v.messageId === messageId)
          .sort((a, b) => a.compteId - b.compteId)
          .flatMap((v) => {
            const option = tables.optionsSondages.get(v.optionId);
            return option ? [{ compteId: v.compteId, ordre: option.ordre }] : [];
          });
        return [[messageId, { ...s, options: options.map(({ id, ordre, lieuChiffre }) => ({ id, ordre, lieuChiffre })), votes }]];
      }));
    },
    async voterSondage(messageId, compteId, ordre, maintenant) {
      const option = optionsDe(messageId).find((o) => o.ordre === ordre);
      if (!option) return false;
      const vote = tables.votesSondages.find((v) => v.messageId === messageId && v.compteId === compteId);
      if (vote?.optionId === option.id) return false;
      if (vote) Object.assign(vote, { optionId: option.id, voteLe: maintenant });
      else tables.votesSondages.push({ messageId, compteId, optionId: option.id, voteLe: maintenant });
      return true;
    },
    async retirerVoteSondage(messageId, compteId) {
      const i = tables.votesSondages.findIndex((v) => v.messageId === messageId && v.compteId === compteId);
      if (i < 0) return false;
      tables.votesSondages.splice(i, 1);
      return true;
    },
    async supprimerSondage(messageId) {
      oublierSondagesEnMemoire(tables, [messageId]);
    },
    async listerSondagesEchus(maintenant, nombre) {
      return [...tables.sondages.values()]
        .filter((s) => s.closLe === null && s.finLe.getTime() <= maintenant.getTime())
        .sort((a, b) => a.finLe.getTime() - b.finLe.getTime() || a.messageId - b.messageId)
        .slice(0, nombre)
        .flatMap((s) => {
          const message = tables.messages.get(s.messageId);
          return message ? [{ messageId: s.messageId, conversationId: message.conversationId }] : [];
        });
    },
    async cloreSondage(messageId, gagnant, maintenant) {
      const s = tables.sondages.get(messageId);
      if (!s || s.closLe !== null) return false;
      Object.assign(s, { closLe: maintenant, gagnant });
      return true;
    },
    async lireNomsLieux(ids) {
      return new Map(ids.flatMap((id) => {
        const nom = tables.lieux.get(id)?.nom;
        return nom === undefined ? [] : [[id, nom] as const];
      }));
    },
    async listerSortiesARappeler(apres, jusqua, nombre) {
      return [...tables.sorties.values()]
        .filter((s) => s.rappelEnvoyeLe === null && s.voteTermineLe !== null && s.quand.getTime() > apres.getTime() && s.quand.getTime() <= jusqua.getTime())
        .sort((a, b) => a.quand.getTime() - b.quand.getTime() || a.id - b.id)
        .slice(0, nombre)
        .map((s) => s.id);
    },
    async prendreRappelSortie(sortieId, apres, jusqua, maintenant) {
      const s = tables.sorties.get(sortieId);
      if (!s || s.rappelEnvoyeLe !== null || s.voteTermineLe === null || s.quand.getTime() <= apres.getTime() || s.quand.getTime() > jusqua.getTime()) return null;
      s.rappelEnvoyeLe = maintenant;
      return { id: s.id, conversationId: s.conversationId, titre: s.titre, quand: s.quand, creeLe: s.creeLe };
    },
    async lireParticipantsSortie(sortieId) {
      return tables.invitationsSorties.filter((i) => i.sortieId === sortieId && i.statut === "accepte").map((i) => i.compteId).sort((a, b) => a - b);
    },
  };
}
