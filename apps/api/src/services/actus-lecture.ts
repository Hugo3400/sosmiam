import { ARTICLES_ACTUS_PAR_PAGE, type RubriqueActus } from "../../../../packages/commun/src/regles/actus.ts";
import { calculerJourParis } from "../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import type { ArticleActus } from "../../../../packages/commun/src/types/actus.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { ecrireCurseurActus } from "../fonctions/actus/ecrire-curseur-actus.ts";
import { presenterArticleActus } from "../fonctions/actus/presenter-article-actus.ts";
import { SELECTION_ARTICLE_ACTUS, type LigneArticleActus } from "./actus-regles.ts";

type BaseActusLecture = Pick<typeof baseDeDonnees, "articleActus" | "jaimeArticleActus" | "lieuArticleActus">;

export type FiltresActus = {
  rubrique: RubriqueActus | null;
  ville: string | null;
  curseur: { publieLe: Date; id: number } | null;
  avecAlcool: boolean;
  compteId: number | null;
};

export type PageActus = { articles: ArticleActus[]; suivant: string | null };

export type ActusLecture = ReturnType<typeof creerActusLecture>;

const ABONNEMENTS_JOURS = 30;

export function creerActusLecture(base: BaseActusLecture = baseDeDonnees, horloge: () => number = Date.now) {
  const aujourdhui = () => new Date(`${calculerJourParis(horloge())}T00:00:00Z`);

  function visibles(avecAlcool: boolean, sansBonsPlansFinis: boolean): Prisma.ArticleActusWhereInput {
    return {
      statut: "publie",
      ...(avecAlcool ? {} : { alcool: false, lieux: { none: { lieu: { type: "bar" } } } }),
      ...(sansBonsPlansFinis ? { OR: [{ finLe: null }, { finLe: { gte: aujourdhui() } }] } : {}),
    };
  }

  async function presenter(lignes: LigneArticleActus[], compteId: number | null): Promise<ArticleActus[]> {
    if (lignes.length === 0) return [];
    const ids = lignes.map((l) => l.id);
    const [comptes, miens] = await Promise.all([
      base.jaimeArticleActus.groupBy({ by: ["articleId"], where: { articleId: { in: ids } }, _count: { _all: true } }),
      compteId === null ? Promise.resolve([]) : base.jaimeArticleActus.findMany({ where: { compteId, articleId: { in: ids } }, select: { articleId: true } }),
    ]);
    const jaimes = new Map(comptes.map((c) => [c.articleId, c._count._all]));
    const aimes = new Set(miens.map((m) => m.articleId));
    return lignes.map((l) => presenterArticleActus(l, jaimes.get(l.id) ?? 0, compteId === null ? undefined : aimes.has(l.id)));
  }

  return {
    async lister({ rubrique, ville, curseur, avecAlcool, compteId }: FiltresActus): Promise<PageActus> {
      const sansFiltre = rubrique === null && ville === null;
      const une = sansFiltre && curseur === null
        ? await base.articleActus.findFirst({ where: { ...visibles(avecAlcool, true), aLaUne: true }, orderBy: { publieLe: "desc" }, select: SELECTION_ARTICLE_ACTUS })
        : null;
      const where: Prisma.ArticleActusWhereInput = {
        AND: [
          visibles(avecAlcool, true),
          rubrique ? { rubrique } : {},
          ville ? { lieux: { some: { lieu: { ville, statut: "publie" } } } } : {},
          sansFiltre ? { aLaUne: false } : {},
          curseur ? { OR: [{ publieLe: { lt: curseur.publieLe } }, { publieLe: curseur.publieLe, id: { lt: curseur.id } }] } : {},
        ],
      };
      const lignes = await base.articleActus.findMany({
        where,
        orderBy: [{ publieLe: "desc" }, { id: "desc" }],
        take: ARTICLES_ACTUS_PAR_PAGE + 1,
        select: SELECTION_ARTICLE_ACTUS,
      });
      const page = lignes.slice(0, ARTICLES_ACTUS_PAR_PAGE);
      const derniere = page.at(-1);
      const suivant = lignes.length > ARTICLES_ACTUS_PAR_PAGE && derniere?.publieLe ? ecrireCurseurActus(derniere.publieLe, derniere.id) : null;
      return { articles: await presenter(une ? [une, ...page] : page, compteId), suivant };
    },

    async villes(avecAlcool: boolean): Promise<{ ville: string; articles: number }[]> {
      const liens = await base.lieuArticleActus.findMany({
        where: { article: visibles(avecAlcool, true), lieu: { statut: "publie" } },
        select: { articleId: true, lieu: { select: { ville: true } } },
      });
      const parVille = new Map<string, Set<number>>();
      for (const { articleId, lieu } of liens) parVille.set(lieu.ville, (parVille.get(lieu.ville) ?? new Set()).add(articleId));
      return [...parVille].map(([ville, articles]) => ({ ville, articles: articles.size })).sort((a, b) => b.articles - a.articles || a.ville.localeCompare(b.ville, "fr"));
    },

    async lire(id: number, avecAlcool: boolean, compteId: number | null): Promise<ArticleActus | null> {
      const ligne = await base.articleActus.findFirst({ where: { id, ...visibles(avecAlcool, false) }, select: SELECTION_ARTICLE_ACTUS });
      if (!ligne) return null;
      const [article] = await presenter([ligne], compteId);
      return article ?? null;
    },

    async abonnements(compteId: number): Promise<ArticleActus[]> {
      const lignes = await base.articleActus.findMany({
        where: {
          ...visibles(true, true),
          publieLe: { gte: new Date(horloge() - ABONNEMENTS_JOURS * 86_400_000) },
          auteur: { suivisRecus: { some: { suiveurId: compteId, statut: "accepte" } } },
        },
        orderBy: [{ publieLe: "desc" }, { id: "desc" }],
        take: ARTICLES_ACTUS_PAR_PAGE,
        select: SELECTION_ARTICLE_ACTUS,
      });
      return presenter(lignes, compteId);
    },

    async aimer(compteId: number, id: number, aime: boolean): Promise<{ jaime: number; aime: boolean } | null> {
      const visible = await base.articleActus.count({ where: { id, statut: "publie" } });
      if (visible === 0) return null;
      if (aime) await base.jaimeArticleActus.createMany({ data: [{ compteId, articleId: id }], skipDuplicates: true });
      else await base.jaimeArticleActus.deleteMany({ where: { compteId, articleId: id } });
      return { jaime: await base.jaimeArticleActus.count({ where: { articleId: id } }), aime };
    },
  };
}
