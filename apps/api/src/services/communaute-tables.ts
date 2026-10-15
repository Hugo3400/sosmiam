import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { CHAMPS_SORTIE_MIAMIS } from "./communaute-champs.ts";
import { effacerConversations } from "./effacer-conversations.ts";
import type { DepotCommunaute, LigneParticipationMiamis, LigneSortieMiamis, StatutParticipationMiamis, TablesCommunaute } from "./communaute-regles.ts";
import { creerTablesIdees } from "./communaute-tables-idees.ts";
import { creerTablesQuiEstLa } from "./communaute-tables-qui-est-la.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

type Client = Prisma.TransactionClient;

const DELAIS_TRANSACTION = { maxWait: 5_000, timeout: 15_000 };

export function creerTablesCommunaute(base: Client, relations: RelationsSociales, medias: StockageMediasChat, tx?: Client): TablesCommunaute {
  const lire = async (where: Prisma.SortieDesMiamisWhereInput, nombre?: number, ordre: Prisma.SortieDesMiamisOrderByWithRelationInput[] = [{ quand: "asc" }, { id: "asc" }]) =>
    (await base.sortieDesMiamis.findMany({ where, select: CHAMPS_SORTIE_MIAMIS, orderBy: ordre, ...(nombre ? { take: nombre } : {}) })) as LigneSortieMiamis[];
  const versParticipation = (p: Omit<LigneParticipationMiamis, "statut"> & { statut: string }): LigneParticipationMiamis => ({ ...p, statut: p.statut as StatutParticipationMiamis });

  return {
    ...creerTablesQuiEstLa(base),
    ...creerTablesIdees(base),

    async verrouillerComptes(compteIds) {
      const ids = [...new Set(compteIds)].filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
      if (ids.length > 0) await base.$queryRaw`SELECT id FROM comptes WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR NO KEY UPDATE`;
    },
    async verrouillerSortie(id) {
      const lignes = await base.$queryRaw<{ id: number }[]>`SELECT id FROM sorties_des_miamis WHERE id = ${id} FOR UPDATE`;
      return lignes.length > 0 ? ((await lire({ id }))[0] ?? null) : null;
    },
    bloqueEntre: (a, b) => relations.bloqueEntre(a, b, tx),
    async listerPairesBloquees(ids) {
      if (ids.length < 2) return [];
      const lignes = await base.blocage.findMany({ where: { bloqueurId: { in: [...ids] }, bloqueId: { in: [...ids] } }, select: { bloqueurId: true, bloqueId: true } });
      return lignes.map((l) => [l.bloqueurId, l.bloqueId] as [number, number]);
    },
    lireIdempotence: (compteId, cle, ressource) => relations.lireIdempotence(compteId, cle, ressource, tx),
    noterIdempotence: (compteId, cle, ressource, ressourceId, maintenant) => relations.noterIdempotence(compteId, cle, ressource, ressourceId, maintenant, tx),
    lireSorties: (ids) => (ids.length === 0 ? Promise.resolve([]) : lire({ id: { in: [...ids] } })),
    listerSortiesVille: (villeCle, apres, nombre) => lire({ villeCle, quand: { gt: apres }, annuleeLe: null, retireeLe: null }, nombre),
    listerSortiesDe: (compteId, apres, nombre) => lire({ quand: { gt: apres }, annuleeLe: null, retireeLe: null, participations: { some: { compteId } } }, nombre),
    async lireParticipations(sortieIds) {
      if (sortieIds.length === 0) return [];
      const lignes = await base.participationSortieDesMiamis.findMany({ where: { sortieId: { in: [...sortieIds] } } });
      return lignes.map(versParticipation);
    },
    compterSortiesAVenir: (organisateurId, maintenant) => base.sortieDesMiamis.count({ where: { organisateurId, quand: { gt: maintenant }, annuleeLe: null, retireeLe: null } }),
    async creerSortie(s, maintenant) {
      const cree = await base.sortieDesMiamis.create({
        data: {
          organisateurId: s.organisateurId, lieuId: s.lieuId, conversationId: s.conversationId, titre: s.titre, description: s.description, quand: s.quand,
          villeCle: s.villeCle, publicType: s.publicType, publicValeur: s.publicValeur, places: s.places, placeGardeeNouveau: s.placeGardeeNouveau,
          recurrente: s.recurrente, serieId: s.serieId, modifieLe: maintenant, creeLe: maintenant,
          etiquettes: { create: s.etiquettes.map((e) => ({ nom: e.nom, officielle: e.officielle })) },
        },
        select: { id: true },
      });
      return cree.id;
    },
    async changerSortie(id, changement, maintenant) {
      await base.sortieDesMiamis.update({ where: { id }, data: { ...changement, version: { increment: 1 }, modifieLe: maintenant }, select: { id: true } });
    },
    async ecrireParticipation(p) {
      const data = { statut: p.statut, habitue: p.habitue, creeLe: p.creeLe, decideLe: p.decideLe, ...(p.presentLe !== undefined ? { presentLe: p.presentLe } : {}) };
      await base.participationSortieDesMiamis.upsert({
        where: { sortieId_compteId: { sortieId: p.sortieId, compteId: p.compteId } }, create: { sortieId: p.sortieId, compteId: p.compteId, ...data }, update: data,
      });
      await base.sortieDesMiamis.update({ where: { id: p.sortieId }, data: { version: { increment: 1 } }, select: { id: true } });
    },
    async effacerParticipation(sortieId, compteId) {
      const { count } = await base.participationSortieDesMiamis.deleteMany({ where: { sortieId, compteId } });
      if (count > 0) await base.sortieDesMiamis.update({ where: { id: sortieId }, data: { version: { increment: 1 } }, select: { id: true } });
    },
    async lireLieux(ids) {
      if (ids.length === 0) return new Map();
      const lignes = await base.lieu.findMany({ where: { id: { in: [...ids] } }, select: { id: true, nom: true, emoji: true, type: true, ville: true, statut: true } });
      return new Map(lignes.map(({ statut, ...l }) => [l.id, { ...l, publie: statut === "publie" }]));
    },
    async lireComptes(ids) {
      if (ids.length === 0) return new Map();
      const lignes = await base.compte.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, creeLe: true, ville: true, dateNaissanceChiffree: true, ambassadeur: { select: { statut: true } }, profilSocial: { select: { activitePartagee: true } } },
      });
      return new Map(lignes.map((l) => [l.id, {
        id: l.id, creeLe: l.creeLe, ville: l.ville, dateNaissanceChiffree: l.dateNaissanceChiffree, ambassadeurActif: l.ambassadeur?.statut === "actif",
        activitePartagee: l.profilSocial?.activitePartagee ?? false,
      }]));
    },
    async compterRescousses(ids) {
      if (ids.length === 0) return new Map();
      const lignes = await base.rescousse.groupBy({ by: ["compteId"], where: { compteId: { in: [...ids] } }, _count: { _all: true } });
      return new Map(lignes.map((l) => [l.compteId, l._count._all]));
    },
    async lireHistoriques(ids, maintenant) {
      if (ids.length === 0) return [];
      const lignes = await base.participationSortieDesMiamis.findMany({
        where: { compteId: { in: [...ids] }, statut: { in: ["organise", "accepte", "desiste"] }, sortie: { OR: [{ quand: { lte: maintenant } }, { annuleeLe: { not: null } }] } },
        select: {
          compteId: true, statut: true,
          sortie: { select: { quand: true, annuleeLe: true, annulationTardive: true, _count: { select: { participations: { where: { statut: "accepte" } } } } } },
        },
      });
      return lignes.map((l) => ({
        compteId: l.compteId, statut: l.statut as StatutParticipationMiamis, quand: l.sortie.quand, annulee: l.sortie.annuleeLe !== null,
        annulationTardive: l.sortie.annulationTardive, autresAcceptes: l.sortie._count.participations,
      }));
    },
    async aUneVisiteValidee(compteId, lieuId, de, a) {
      return (await base.visite.count({ where: { compteId, lieuId, statut: "validee", OR: [{ valideLe: { gte: de, lte: a } }, { valideLe: null, creeLe: { gte: de, lte: a } }] } })) > 0;
    },
    async creerConversation(organisateurId, maintenant) {
      const conversation = await base.conversation.create({
        data: { type: "sortie", creeParId: organisateurId, dernierMessageLe: maintenant, modifieLe: maintenant, creeLe: maintenant, membres: { create: [{ compteId: organisateurId, arriveLe: maintenant }] } },
        select: { id: true },
      });
      return conversation.id;
    },
    async ajouterMembre(conversationId, compteId, maintenant) {
      const { count } = await base.membreConversation.createMany({ data: [{ conversationId, compteId, arriveLe: maintenant }], skipDuplicates: true });
      if (count > 0) await base.conversation.update({ where: { id: conversationId }, data: { version: { increment: 1 }, modifieLe: maintenant }, select: { id: true } });
    },
    async retirerMembre(conversationId, compteId, maintenant) {
      const { count } = await base.membreConversation.deleteMany({ where: { conversationId, compteId } });
      if (count > 0) await base.conversation.update({ where: { id: conversationId }, data: { version: { increment: 1 }, modifieLe: maintenant }, select: { id: true } });
    },
    async effacerConversation(conversationId) {
      const efface = await effacerConversations(base, [conversationId], medias);
      return async () => void (await efface.apresTransaction(baseDeDonnees));
    },
    listerSortiesARappeler: (maintenant, jusqua, nombre) => lire({ annuleeLe: null, retireeLe: null, rappelEnvoyeLe: null, quand: { gt: maintenant, lte: jusqua } }, nombre),
    listerSortiesAContinuer: (avant, nombre) => lire({ recurrente: true, annuleeLe: null, retireeLe: null, suiteTraiteeLe: null, quand: { lte: avant } }, nombre),
  };
}

export function creerDepotCommunaute(o: { relations: RelationsSociales; medias: StockageMediasChat; base?: typeof baseDeDonnees }): DepotCommunaute {
  const base = o.base ?? baseDeDonnees;
  return {
    lire: (fn) => fn(creerTablesCommunaute(base, o.relations, o.medias)),
    ecrire: (fn) => base.$transaction((tx) => fn(creerTablesCommunaute(tx, o.relations, o.medias, tx)), DELAIS_TRANSACTION),
  };
}
