import type { MotifModeration } from "../../../../../packages/commun/src/contenus/motifs-moderation.ts";
import { parleDAlcool } from "../../../../../packages/commun/src/fonctions/prevention/parle-d-alcool.ts";
import { BADGES_ACTUS, POINTS_ARTICLE_ACTUS } from "../../../../../packages/commun/src/regles/actus.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { RaisonPoints } from "../comptes.ts";
import type { NouvelleNotificationCloche } from "../effets-sociaux-regles.ts";
import { listerActusARelire } from "./actus-a-relire.ts";

type BaseActusGestion = Pick<typeof baseDeDonnees, "$transaction" | "articleActus" | "reponseLieuActus" | "rattachementLieu" | "signalement" | "commentaireArticleActus">;

export type DependancesActusGestion = {
  ajouterPointsDans: (tx: Prisma.TransactionClient, compteId: number, points: number, raison: RaisonPoints, detail?: string) => Promise<unknown>;
  cloche: { noter: (notifications: NouvelleNotificationCloche[], maintenant: Date) => Promise<unknown> } | null;
  base?: BaseActusGestion;
  horloge?: () => number;
};

export type DecisionActus = { ok: true } | { ok: false; erreur: "introuvable" | "deja-decide" };

export type ActusGestion = ReturnType<typeof creerActusGestion>;

const DETAIL_MAX = 120;

export function creerActusGestion({ ajouterPointsDans, cloche, base = baseDeDonnees, horloge = Date.now }: DependancesActusGestion) {
  const prevenir = async (notifications: NouvelleNotificationCloche[], maintenant: Date) => {
    if (cloche && notifications.length > 0) await cloche.noter(notifications, maintenant).catch(() => {});
  };

  const ecrireDecision = (tx: Prisma.TransactionClient, e: { cible: "article-actu" | "reponse-actu"; id: number; lieuId: number | null; auteurId: number | null; motif: MotifModeration; motivation: string; maintenant: Date }) =>
    tx.signalement.create({
      data: {
        cible: e.cible, cibleId: String(e.id), lieuId: e.lieuId, raison: "relecture", explication: "", source: "equipe", statut: "retenu",
        motif: e.motif, motivation: e.motivation, traiteLe: e.maintenant, signaleParId: null, auteurContenuId: e.auteurId,
      },
      select: { id: true },
    });

  async function lireGerants(lieuIds: number[], sauf: number): Promise<number[]> {
    if (lieuIds.length === 0) return [];
    const liens = await base.rattachementLieu.findMany({ where: { lieuId: { in: lieuIds }, statut: "valide", role: "gerant", compteId: { not: sauf } }, select: { compteId: true } });
    return [...new Set(liens.map((l) => l.compteId))];
  }

  async function lireArticle(id: number) {
    return base.articleActus.findUnique({ where: { id }, select: { statut: true, auteurId: true, publieLe: true, titre: true, alcool: true, lieux: { orderBy: { rang: "asc" }, select: { lieuId: true } } } });
  }

  return {
    lister: () => listerActusARelire(base),

    async publier(id: number, choix: { aLaUne: boolean; alcool: boolean }): Promise<DecisionActus> {
      const article = await lireArticle(id);
      if (!article) return { ok: false, erreur: "introuvable" };
      if (article.statut !== "en-relecture") return { ok: false, erreur: "deja-decide" };
      const maintenant = new Date(horloge());
      const fait = await base.$transaction(async (tx) => {
        const change = await tx.articleActus.updateMany({
          where: { id, statut: "en-relecture" },
          data: { statut: "publie", publieLe: article.publieLe ?? maintenant, aLaUne: choix.aLaUne, alcool: article.alcool || choix.alcool },
        });
        if (change.count === 0) return false;
        if (choix.aLaUne) await tx.articleActus.updateMany({ where: { aLaUne: true, id: { not: id } }, data: { aLaUne: false } });
        if (!article.publieLe) {
          await ajouterPointsDans(tx, article.auteurId, POINTS_ARTICLE_ACTUS, "article-actus", `article ${id}`);
          const publies = await tx.articleActus.count({ where: { auteurId: article.auteurId, publieLe: { not: null } } });
          const gagnes = BADGES_ACTUS.filter((b) => publies >= b.objectif).map((b) => ({ compteId: article.auteurId, badge: b.id }));
          if (gagnes.length > 0) await tx.badgeCompte.createMany({ data: gagnes, skipDuplicates: true });
        }
        return true;
      });
      if (!fait) return { ok: false, erreur: "deja-decide" };
      const detail = article.titre.slice(0, DETAIL_MAX);
      const cible = { type: "article-actu" as const, id: String(id) };
      const gerants = await lireGerants(article.lieux.map((l) => l.lieuId), article.auteurId);
      await prevenir([
        { compteId: article.auteurId, type: "actu-publiee", acteurId: null, cible, detail },
        ...gerants.map((compteId) => ({ compteId, type: "actu-lieu-cite" as const, acteurId: null, cible, detail })),
      ], maintenant);
      return { ok: true };
    },

    async retoucher(id: number, message: string): Promise<DecisionActus> {
      const article = await lireArticle(id);
      if (!article) return { ok: false, erreur: "introuvable" };
      const maintenant = new Date(horloge());
      const change = await base.articleActus.updateMany({ where: { id, statut: "en-relecture" }, data: { statut: "a-retoucher", retoucheMessage: message, retoucheLe: maintenant } });
      if (change.count === 0) return { ok: false, erreur: "deja-decide" };
      await prevenir([{ compteId: article.auteurId, type: "actu-a-retoucher", acteurId: null, cible: { type: "article-actu", id: String(id) }, detail: article.titre.slice(0, DETAIL_MAX) }], maintenant);
      return { ok: true };
    },

    async refuser(id: number, motif: MotifModeration, motivation: string): Promise<DecisionActus> {
      const article = await lireArticle(id);
      if (!article) return { ok: false, erreur: "introuvable" };
      const maintenant = new Date(horloge());
      const decision = await base.$transaction(async (tx) => {
        const change = await tx.articleActus.updateMany({ where: { id, statut: "en-relecture" }, data: { statut: "refuse", refusMotif: motif, refusMotivation: motivation, refusLe: maintenant } });
        if (change.count === 0) return null;
        return ecrireDecision(tx, { cible: "article-actu", id, lieuId: article.lieux[0]?.lieuId ?? null, auteurId: article.auteurId, motif, motivation, maintenant });
      });
      if (!decision) return { ok: false, erreur: "deja-decide" };
      await prevenir([{ compteId: article.auteurId, type: "actu-refusee", acteurId: null, cible: { type: "signalement", id: String(decision.id) }, detail: motif }], maintenant);
      return { ok: true };
    },

    async publierReponse(id: number): Promise<DecisionActus> {
      const reponse = await base.reponseLieuActus.findUnique({ where: { id }, select: { statut: true, articleId: true, ecritParId: true, texte: true } });
      if (!reponse) return { ok: false, erreur: "introuvable" };
      const maintenant = new Date(horloge());
      const fait = await base.$transaction(async (tx) => {
        const change = await tx.reponseLieuActus.updateMany({ where: { id, statut: "en-relecture" }, data: { statut: "publie", decideLe: maintenant } });
        if (change.count === 0) return false;
        if (parleDAlcool(reponse.texte)) await tx.articleActus.update({ where: { id: reponse.articleId }, data: { alcool: true } });
        return true;
      });
      if (!fait) return { ok: false, erreur: "deja-decide" };
      if (reponse.ecritParId !== null) {
        await prevenir([{ compteId: reponse.ecritParId, type: "actu-reponse-publiee", acteurId: null, cible: { type: "article-actu", id: String(reponse.articleId) } }], maintenant);
      }
      return { ok: true };
    },

    async refuserReponse(id: number, motif: MotifModeration, motivation: string): Promise<DecisionActus> {
      const reponse = await base.reponseLieuActus.findUnique({ where: { id }, select: { statut: true, lieuId: true, ecritParId: true } });
      if (!reponse) return { ok: false, erreur: "introuvable" };
      const maintenant = new Date(horloge());
      const decision = await base.$transaction(async (tx) => {
        const change = await tx.reponseLieuActus.updateMany({ where: { id, statut: "en-relecture" }, data: { statut: "refuse", refusMotif: motif, decideLe: maintenant } });
        if (change.count === 0) return null;
        return ecrireDecision(tx, { cible: "reponse-actu", id, lieuId: reponse.lieuId, auteurId: reponse.ecritParId, motif, motivation, maintenant });
      });
      if (!decision) return { ok: false, erreur: "deja-decide" };
      if (reponse.ecritParId !== null) {
        await prevenir([{ compteId: reponse.ecritParId, type: "actu-reponse-refusee", acteurId: null, cible: { type: "signalement", id: String(decision.id) }, detail: motif }], maintenant);
      }
      return { ok: true };
    },

    async compter(): Promise<number> {
      const [articles, reponses] = await Promise.all([
        base.articleActus.count({ where: { statut: "en-relecture" } }),
        base.reponseLieuActus.count({ where: { statut: "en-relecture" } }),
      ]);
      return articles + reponses;
    },

    async appliquerDecisionDans(
      tx: Prisma.TransactionClient, signalement: { cible: string; cibleId: string; raison: string }, decision: "retenu" | "rejete", reexamen: boolean,
    ): Promise<void> {
      const id = Number(signalement.cibleId);
      if (signalement.cible === "comment-actu") {
        if (!Number.isSafeInteger(id)) return;
        if (decision === "retenu") await tx.commentaireArticleActus.updateMany({ where: { id, retireLe: null }, data: { retireLe: new Date(horloge()) } });
        else if (reexamen) await tx.commentaireArticleActus.updateMany({ where: { id, retireLe: { not: null } }, data: { retireLe: null } });
        return;
      }
      const table = signalement.cible === "article-actu" ? tx.articleActus : signalement.cible === "reponse-actu" ? tx.reponseLieuActus : null;
      if (!table || !Number.isSafeInteger(id)) return;
      const changer = (de: string, vers: string, enPlus: Record<string, unknown> = {}) =>
        (table as typeof tx.articleActus).updateMany({ where: { id, statut: de }, data: { statut: vers, ...enPlus } });
      if (signalement.raison === "relecture") {
        if (decision === "rejete" && reexamen) await changer("refuse", "en-relecture", signalement.cible === "reponse-actu" ? { refusMotif: null } : {});
        return;
      }
      if (decision === "retenu") await changer("publie", "retire", signalement.cible === "article-actu" ? { aLaUne: false } : {});
      else if (reexamen) await changer("retire", "publie");
    },
  };
}

let actusBranchees: ActusGestion | null = null;

export function brancherActusGestion(actus: ActusGestion): void {
  actusBranchees = actus;
}

export function lireActusGestion(): ActusGestion | null {
  return actusBranchees;
}
