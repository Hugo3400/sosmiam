// Défis de l'app et badges automatiques dans la base. La réévaluation d'un compte lit ses faits et écrit ses réussites sous
// verrou (SELECT … FROM comptes WHERE id = … FOR UPDATE) : deux réévaluations en même temps ne créditent jamais deux fois
// (et la clé de DefiReussi, compte + défi, l'interdit de toute façon). Les points (ajouterPoints, raison « defi ») et les
// badges (donnerBadge) sont posés juste après, hors du verrou : ajouterPoints écrit la ligne du compte dans sa propre
// transaction, qui attendrait sinon la fin de celle-ci. Ce qui change est décidé par evaluerDefisCompte (fonctions/defis/).
import { calculerJourParis } from "../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import { decalerJour } from "../../../../packages/commun/src/fonctions/temps/decaler-jour.ts";
import { JOURS_RATTRAPAGE_DEFI } from "../../../../packages/commun/src/regles/defis.ts";
import type { BrouillonDefi, FaitsDefi } from "../../../../packages/commun/src/types/defi.ts";
import { validerDefi } from "../../../../packages/commun/src/validation/valider-defi.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { evaluerDefisCompte, type EvaluationDefis } from "../fonctions/defis/evaluer-defis-compte.ts";
import { preparerModificationDefi } from "../fonctions/defis/preparer-modification-defi.ts";
import { presenterDefiGestion } from "../fonctions/defis/presenter-defi-gestion.ts";
import type { DependancesServicesDefis, ServicesDefis } from "./defis-regles.ts";

type Client = Prisma.TransactionClient;

const ORDRE_DEFIS = [{ ordre: "asc" }, { debut: "asc" }, { id: "asc" }] as const satisfies Prisma.DefiOrderByWithRelationInput[];

/** Le brouillon tel que Prisma l'écrit (filtres null : DbNull) */
const versDonnees = (b: BrouillonDefi) => ({ ...b, filtres: b.filtres === null ? Prisma.DbNull : (b.filtres as Prisma.InputJsonValue) });

/** Les faits datés du compte que comptent les mesures (quelques centaines de lignes au plus par compte) */
async function lireFaits(client: Client, compteId: number): Promise<FaitsDefi> {
  const rescousses = await client.rescousse.findMany({ where: { compteId }, select: { creeLe: true } });
  const premiers = await client.premierSauveteur.findMany({ where: { compteId }, select: { creeLe: true } });
  const visites = await client.visite.findMany({
    where: { compteId, statut: "validee", valideLe: { not: null } },
    select: { valideLe: true, lieuId: true, pendantSos: true, lieu: { select: { type: true, ville: true } } },
  });
  const avis = await client.avis.findMany({ where: { compteId, statut: "publie" }, select: { creeLe: true, photo: true } });
  return {
    rescousses: rescousses.map((r) => r.creeLe.getTime()),
    premiersSauvetages: premiers.map((p) => p.creeLe.getTime()),
    visites: visites.map((v) => ({ le: v.valideLe!.getTime(), lieuId: v.lieuId, typeLieu: v.lieu.type, ville: v.lieu.ville, pendantSos: v.pendantSos })),
    avis: avis.map((a) => ({ le: a.creeLe.getTime(), avecPhoto: a.photo !== null })),
  };
}

export function creerDefis({ ajouterPoints, donnerBadge }: DependancesServicesDefis): ServicesDefis {
  /** Recompte, écrit les réussites sous verrou, puis pose points et badges ; null si le compte n'existe plus */
  async function evaluer(compteId: number, maintenant: Date): Promise<EvaluationDefis | null> {
    const jour = calculerJourParis(maintenant.getTime());
    const evaluation = await baseDeDonnees.$transaction(async (transaction) => {
      const verrou = await transaction.$queryRaw<{ id: number }[]>`SELECT id FROM comptes WHERE id = ${compteId} FOR UPDATE`;
      if (verrou.length === 0) return null;
      // Les défis publiés, sauf ceux finis depuis plus que le rattrapage et jamais réussis par ce compte
      const defis = await transaction.defi.findMany({
        where: { publie: true, OR: [{ fin: null }, { fin: { gte: decalerJour(jour, -JOURS_RATTRAPAGE_DEFI) } }, { reussites: { some: { compteId } } }] },
        orderBy: ORDRE_DEFIS,
      });
      const reussites = await transaction.defiReussi.findMany({ where: { compteId }, select: { defiId: true, points: true, reussiLe: true } });
      const badges = await transaction.badgeCompte.findMany({ where: { compteId }, select: { badge: true } });
      const faits = await lireFaits(transaction, compteId);
      const e = evaluerDefisCompte({ defis, reussites, faits, badges: badges.map((b) => b.badge), maintenant });
      const credites: EvaluationDefis["aCrediter"] = [];
      for (const c of e.aCrediter) {
        const { count } = await transaction.defiReussi.createMany({ data: [{ compteId, defiId: c.defiId, points: c.points, reussiLe: maintenant }], skipDuplicates: true });
        if (count === 1) credites.push(c);
      }
      const repris: EvaluationDefis["aReprendre"] = [];
      for (const r of e.aReprendre) {
        const { count } = await transaction.defiReussi.deleteMany({ where: { compteId, defiId: r.defiId } });
        if (count === 1) repris.push(r);
      }
      return { ...e, aCrediter: credites, aReprendre: repris };
    });
    if (!evaluation) return null;

    for (const c of evaluation.aCrediter) {
      try {
        await ajouterPoints(compteId, c.points, "defi", `defi:${c.defiId}`);
      } catch (erreur) {
        // Points pas crédités : la réussite est effacée, la prochaine réévaluation recommencera
        await baseDeDonnees.defiReussi.deleteMany({ where: { compteId, defiId: c.defiId } }).catch(() => {});
        throw erreur;
      }
    }
    for (const r of evaluation.aReprendre) await ajouterPoints(compteId, -r.points, "defi", `defi:${r.defiId} retiré`);
    for (const badge of evaluation.badges) await donnerBadge(compteId, badge);
    return evaluation;
  }

  /** Le défi verrouillé (FOR UPDATE : une réussite ne s'écrit pas pendant qu'on le change) et son nombre de réussites */
  async function lireVerrouille(transaction: Client, id: number) {
    const verrou = await transaction.$queryRaw<{ id: number }[]>`SELECT id FROM defis WHERE id = ${id} FOR UPDATE`;
    if (verrou.length === 0) return null;
    const defi = await transaction.defi.findUniqueOrThrow({ where: { id } });
    return { defi, reussites: await transaction.defiReussi.count({ where: { defiId: id } }) };
  }

  return {
    async listerPourCompte(compteId, maintenant) {
      return (await evaluer(compteId, maintenant))?.defis ?? [];
    },

    async reevaluer(compteId, maintenant) {
      const e = await evaluer(compteId, maintenant);
      return { reussis: e?.aCrediter.map((c) => c.defiId) ?? [], repris: e?.aReprendre.map((r) => r.defiId) ?? [], badges: e?.badges ?? [] };
    },

    async listerGestion() {
      const defis = await baseDeDonnees.defi.findMany({ orderBy: ORDRE_DEFIS, include: { _count: { select: { reussites: true } } } });
      return defis.map((d) => presenterDefiGestion(d, d._count.reussites));
    },

    async creer(brut) {
      const r = validerDefi(brut);
      if (!r.ok) return r;
      const defi = await baseDeDonnees.defi.create({ data: versDonnees(r.defi) });
      return { ok: true, defi: presenterDefiGestion(defi, 0) };
    },

    async modifier(id, brut) {
      return baseDeDonnees.$transaction(async (transaction) => {
        const garde = await lireVerrouille(transaction, id);
        if (!garde) return { ok: false, erreur: "defi-inconnu" } as const;
        const r = preparerModificationDefi(presenterDefiGestion(garde.defi, garde.reussites), garde.reussites, brut);
        if (!r.ok) return r;
        const defi = await transaction.defi.update({ where: { id }, data: versDonnees(r.defi) });
        return { ok: true, defi: presenterDefiGestion(defi, garde.reussites) } as const;
      });
    },

    async supprimer(id) {
      return baseDeDonnees.$transaction(async (transaction) => {
        const garde = await lireVerrouille(transaction, id);
        if (!garde) return { ok: false, erreur: "defi-inconnu" } as const;
        // Ses réussites partiraient avec lui (et la trace des points crédités) : on le dépublie plutôt
        if (garde.reussites > 0) return { ok: false, erreur: "defi-deja-reussi" } as const;
        await transaction.defi.delete({ where: { id } });
        return { ok: true } as const;
      });
    },
  };
}
