// Les avis des lieux dans la base : seulement lire et écrire (les règles sont dans avis-client.ts, avis-relecture.ts et
// avis-pro.ts). ecrire passe par une transaction ; le verrou porte sur la ligne du compte (SELECT … FOR UPDATE) et ne
// fait rien en lecture. Les doublons (un verdict par ambassadeur, une réponse par avis, un avis par visite) sont arrêtés
// par la base elle-même, sans faire échouer la transaction.
import type { RaisonRelecture, StatutAvis, StatutReponseAvis } from "../../../../packages/commun/src/types/avis.ts";
import type { TypeLieu } from "../../../../packages/commun/src/types/lieu.ts";
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { ResultatPosition } from "../../../../packages/commun/src/types/position.ts";
import type { ModeValidation, MotifRefusVisite, ReglementVisite, StatutVisite } from "../../../../packages/commun/src/types/visite.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { DepotAvis, LigneAvis, TablesAvis } from "./avis-regles.ts";
import type { LigneVisite } from "./visites-regles.ts";

type Client = Prisma.TransactionClient;

/** Avec l'avis, ce qu'on lit de sa visite : comment elle a été validée et réglée */
const INCLURE = { visite: { select: { mode: true, reglement: true } } } as const;
type AvisBrut = Prisma.AvisGetPayload<{ include: typeof INCLURE }>;
type VisiteBrute = Awaited<ReturnType<typeof baseDeDonnees.visite.findFirstOrThrow>>;

const versAvis = ({ visite, ...a }: AvisBrut): LigneAvis => ({
  ...a,
  statut: a.statut as StatutAvis,
  raisonRelecture: a.raisonRelecture as RaisonRelecture | null,
  reponseStatut: a.reponseStatut as StatutReponseAvis | null,
  preuve: (visite?.mode ?? null) as ModeValidation | null,
  avecReduction: (visite?.reglement as ReglementVisite | null | undefined)?.type === "reduction",
});

const versVisite = (v: VisiteBrute): LigneVisite => ({
  ...v,
  mode: v.mode as ModeValidation,
  statut: v.statut as StatutVisite,
  resultatPosition: (v.resultatPosition ?? null) as ResultatPosition | null,
  motifRefus: v.motifRefus as MotifRefusVisite | null,
  reglement: (v.reglement ?? null) as ReglementVisite | null,
});

const RESUME = { id: true, nom: true, emoji: true, type: true, ville: true } as const;

function creerTables(b: Client, enTransaction: boolean): TablesAvis {
  return {
    async verrouillerCompte(compteId) {
      if (enTransaction) await b.$queryRaw`SELECT id FROM comptes WHERE id = ${compteId} FOR UPDATE`;
    },

    async lireLieu(lieuId) {
      const lieu = await b.lieu.findUnique({
        where: { id: lieuId },
        select: { ...RESUME, statut: true, _count: { select: { rattachements: { where: { statut: "valide" } } } } },
      });
      if (!lieu) return null;
      const { statut, _count, ...resume } = lieu;
      return { ...resume, type: resume.type as TypeLieu, publie: statut === "publie", verifie: _count.rattachements > 0 };
    },
    async resumerLieux(ids) {
      if (ids.length === 0) return new Map();
      const lieux = await b.lieu.findMany({ where: { id: { in: ids } }, select: RESUME });
      return new Map(lieux.map((l) => [l.id, { ...l, type: l.type as TypeLieu } satisfies LieuResume]));
    },
    async lireCompte(compteId) {
      const compte = await b.compte.findUnique({
        where: { id: compteId },
        select: {
          id: true, prenom: true, nomChiffre: true, dateNaissanceChiffree: true, emailVerifieLe: true, creeLe: true,
          rattachementsLieux: { where: { statut: { in: ["valide", "en-attente"] } }, select: { lieuId: true } },
        },
      });
      if (!compte) return null;
      const { emailVerifieLe, rattachementsLieux, ...reste } = compte;
      return { ...reste, emailVerifie: emailVerifieLe !== null, lieuxLies: rattachementsLieux.map((r) => r.lieuId) };
    },

    async lireVisite(id) {
      const v = await b.visite.findUnique({
        where: { id },
        select: { id: true, compteId: true, lieuId: true, statut: true, mode: true, avisOuvertLe: true, avisFermeLe: true, avisDonne: true, reglement: true },
      });
      return v ? { ...v, statut: v.statut as StatutVisite, mode: v.mode as ModeValidation, reglement: (v.reglement ?? null) as ReglementVisite | null } : null;
    },
    async listerVisitesAvisOuvert(compteId, maintenant) {
      const visites = await b.visite.findMany({
        where: { compteId, statut: "validee", avisDonne: false, avisOuvertLe: { lte: maintenant }, avisFermeLe: { gt: maintenant }, lieu: { statut: "publie" } },
        orderBy: [{ valideLe: "desc" }, { id: "desc" }],
        take: 50,
      });
      return visites.map(versVisite);
    },
    async marquerAvisDonne(visiteId) {
      const { count } = await b.visite.updateMany({ where: { id: visiteId, avisDonne: false }, data: { avisDonne: true } });
      return count === 1;
    },

    async creerAvis(avis) {
      return versAvis(await b.avis.create({ data: avis, include: INCLURE }));
    },
    async lireAvis(id) {
      const avis = await b.avis.findUnique({ where: { id }, include: INCLURE });
      return avis ? versAvis(avis) : null;
    },
    async listerAvisLieu(lieuId, statuts, apres, limite) {
      const avis = await b.avis.findMany({
        where: { lieuId, statut: { in: [...statuts] }, ...(apres !== null ? { id: { lt: apres } } : {}) },
        orderBy: { id: "desc" },
        take: limite,
        include: INCLURE,
      });
      return avis.map(versAvis);
    },
    async compterNotes(lieuId, statuts) {
      const groupes = await b.avis.groupBy({ by: ["note"], where: { lieuId, statut: { in: [...statuts] } }, _count: { _all: true } });
      return groupes.map((g) => ({ note: g.note, nombre: g._count._all }));
    },
    async listerJoursClients(lieuId) {
      // Le jour de Paris de chaque visite validée : deux visites le même jour comptent pour une
      const lignes = await b.$queryRaw<{ compte_id: number; jour: string }[]>`
        SELECT DISTINCT compte_id, to_char(COALESCE(valide_le, cree_le) AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') AS jour
        FROM visites WHERE lieu_id = ${lieuId} AND statut = 'validee'`;
      return lignes.map((l) => ({ client: String(l.compte_id), jour: l.jour }));
    },
    async compterAvisRecents(lieuId, depuis, notes) {
      return b.avis.count({ where: { lieuId, creeLe: { gte: depuis }, note: { in: [...notes] } } });
    },
    async lireDernierAvisNonVerifie(compteId, lieuId) {
      const avis = await b.avis.findFirst({ where: { compteId, lieuId, visiteId: null }, orderBy: { creeLe: "desc" }, select: { creeLe: true } });
      return avis?.creeLe ?? null;
    },

    async listerARelire(ambassadeurId, lieuxExclus, verdictsMax, limite) {
      const avis = await b.avis.findMany({
        where: {
          statut: "en-relecture", mineur: false, compteId: { not: ambassadeurId }, lieuId: { notIn: lieuxExclus },
          lieu: { statut: "publie" }, relectures: { none: { ambassadeurId } },
        },
        orderBy: { id: "asc" },
        // De la marge : ceux qui ont déjà assez de verdicts sont écartés ensuite
        take: limite * 10,
        include: { ...INCLURE, _count: { select: { relectures: { where: { verdict: { in: ["ok", "louche"] } } } } } },
      });
      return avis.filter((a) => a._count.relectures < verdictsMax).slice(0, limite).map(({ _count, ...a }) => versAvis(a));
    },
    async ajouterRelecture(avisId, ambassadeurId, verdict, le) {
      // Un verdict par ambassadeur et par avis (contrainte unique) : un doublon est ignoré, sans erreur
      const { count } = await b.relectureAvis.createMany({
        data: [{ avisId, ambassadeurId, verdict: verdict.type, motif: verdict.type === "louche" ? verdict.motif : null, creeLe: le }],
        skipDuplicates: true,
      });
      return count === 1 ? "ok" : "deja";
    },
    async poserReponse(avisId, { texte, le, parId }) {
      const { count } = await b.avis.updateMany({
        where: { id: avisId, reponseTexte: null },
        data: { reponseTexte: texte, reponseLe: le, reponseParId: parId, reponseStatut: "publiee" },
      });
      return count === 1;
    },
  };
}

export function creerDepotAvis(): DepotAvis {
  return {
    lire: (fn) => fn(creerTables(baseDeDonnees, false)),
    ecrire: (fn) => baseDeDonnees.$transaction((transaction) => fn(creerTables(transaction, true))),
  };
}
