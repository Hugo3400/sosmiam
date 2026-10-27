import type { MotifModeration } from "../../../../../packages/commun/src/contenus/motifs-moderation.ts";
import { CHEMIN_MEDIAS_ACTUS_GESTION, type RubriqueActus } from "../../../../../packages/commun/src/regles/actus.ts";
import type { ActusARelire, CommentaireActusSignale, StatutArticleActus, StatutReponseLieuActus } from "../../../../../packages/commun/src/types/actus.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { listerLieuxCitesActus } from "../../fonctions/actus/lister-lieux-cites-actus.ts";

type BaseActusARelire = Pick<typeof baseDeDonnees, "articleActus" | "reponseLieuActus" | "signalement" | "commentaireArticleActus">;

const ARTICLES_MAX = 300;
const REPONSES_MAX = 300;

const adresseMedia = (nom: string) => `${CHEMIN_MEDIAS_ACTUS_GESTION}/${nom}`;

export type IdsActusARelire = { articles: number[]; reponses: number[] };

export async function listerActusARelire(base: BaseActusARelire = baseDeDonnees, ids?: IdsActusARelire): Promise<ActusARelire> {
  const [lignes, reponses] = await Promise.all([
    base.articleActus.findMany({
      where: ids ? { id: { in: ids.articles } } : {},
      take: ids ? undefined : ARTICLES_MAX,
      orderBy: [{ envoyeLe: "desc" }, { id: "desc" }],
      select: {
        id: true, rubrique: true, titre: true, accroche: true, texte: true, citation: true, couverture: true, photos: true,
        collaboration: true, alcool: true, finLe: true, envoyeLe: true, statut: true, retoucheMessage: true, retoucheLe: true,
        renvoye: true, publieLe: true, refusMotif: true, refusMotivation: true, refusLe: true, auteurId: true,
        auteur: { select: { prenom: true, ville: true, ambassadeur: { select: { statut: true, ville: true } } } },
        lieux: {
          orderBy: { rang: "asc" },
          select: {
            lieu: {
              select: {
                id: true, nom: true, type: true, emoji: true, quartier: true, ville: true, statut: true,
                _count: { select: { rattachements: { where: { statut: "valide" } } } },
              },
            },
          },
        },
      },
    }),
    base.reponseLieuActus.findMany({
      where: ids ? { id: { in: ids.reponses } } : {},
      take: ids ? undefined : REPONSES_MAX,
      orderBy: [{ envoyeLe: "desc" }, { id: "desc" }],
      select: {
        id: true, articleId: true, texte: true, envoyeLe: true, statut: true,
        lieu: { select: { id: true, nom: true, emoji: true } },
        article: { select: { titre: true, auteur: { select: { prenom: true } } } },
      },
    }),
  ]);

  const refuses = lignes.filter((l) => l.refusMotif !== null).map((l) => String(l.id));
  const decisions = refuses.length === 0
    ? []
    : await base.signalement.findMany({ where: { cible: "article-actu", cibleId: { in: refuses }, source: "equipe" }, orderBy: { id: "desc" }, select: { cibleId: true, contestation: true } });
  const contestations = new Map<string, string | null>();
  for (const d of decisions) if (!contestations.has(d.cibleId)) contestations.set(d.cibleId, d.contestation);

  return {
    articles: lignes.map((l) => ({
      id: l.id,
      rubrique: l.rubrique as RubriqueActus,
      titre: l.titre,
      accroche: l.accroche,
      paragraphes: l.texte.split("\n\n"),
      citation: l.citation,
      couverture: adresseMedia(l.couverture),
      photos: l.photos.map(adresseMedia),
      lieux: listerLieuxCitesActus(l.lieux),
      auteur: { id: l.auteurId, prenom: l.auteur.prenom, ambassadeur: l.auteur.ambassadeur?.statut === "actif", ville: l.auteur.ambassadeur?.ville ?? l.auteur.ville ?? "" },
      collaboration: l.collaboration,
      alcool: l.alcool,
      finLe: l.finLe ? l.finLe.toISOString().slice(0, 10) : null,
      envoyeLe: l.envoyeLe.toISOString(),
      statut: l.statut as StatutArticleActus,
      retouche: l.retoucheMessage && l.retoucheLe ? { message: l.retoucheMessage, le: l.retoucheLe.toISOString() } : null,
      renvoye: l.renvoye,
      publieLe: l.publieLe?.toISOString() ?? null,
      refus: l.refusMotif && l.refusMotivation && l.refusLe
        ? { motif: l.refusMotif as MotifModeration, motivation: l.refusMotivation, le: l.refusLe.toISOString(), contestation: contestations.get(String(l.id)) ?? null }
        : null,
    })),
    reponses: reponses.map((r) => ({
      id: r.id,
      articleId: r.articleId,
      titreArticle: r.article.titre,
      auteurArticle: r.article.auteur.prenom,
      lieu: r.lieu,
      texte: r.texte,
      envoyeLe: r.envoyeLe.toISOString(),
      statut: r.statut as StatutReponseLieuActus,
    })),
  };
}

export async function listerCommentairesActusSignales(ids: number[], base: BaseActusARelire = baseDeDonnees): Promise<CommentaireActusSignale[]> {
  if (ids.length === 0) return [];
  const lignes = await base.commentaireArticleActus.findMany({
    where: { id: { in: ids } },
    select: { id: true, articleId: true, texte: true, creeLe: true, retireLe: true, supprimeLe: true, auteur: { select: { prenom: true } }, article: { select: { titre: true } } },
  });
  return lignes.map((c) => ({
    id: c.id, articleId: c.articleId, titreArticle: c.article.titre, auteur: c.auteur.prenom, texte: c.texte, ecritLe: c.creeLe.toISOString(),
    retire: c.retireLe !== null, supprime: c.supprimeLe !== null,
  }));
}
