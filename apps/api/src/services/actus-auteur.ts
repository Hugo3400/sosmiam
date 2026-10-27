import { ARTICLES_ACTUS_PAR_SEMAINE, CHEMIN_MES_MEDIAS_ACTUS, type RubriqueActus } from "../../../../packages/commun/src/regles/actus.ts";
import type { MotifModeration } from "../../../../packages/commun/src/contenus/motifs-moderation.ts";
import { calculerDernierLundiParis } from "../../../../packages/commun/src/fonctions/temps/calculer-dernier-lundi-paris.ts";
import { calculerJourParis } from "../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import type { ArticleEnvoyeActus, BrouillonRetoucheActus, CorpsArticleActus, MonArticleActus, StatutArticleActus } from "../../../../packages/commun/src/types/actus.ts";
import { validerArticleActus } from "../../../../packages/commun/src/validation/valider-article-actus.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { detecterAlcoolActus } from "../fonctions/actus/detecter-alcool-actus.ts";
import { ecrireAdresseImageActus } from "../fonctions/actus/ecrire-adresse-image-actus.ts";
import { echecActus, type EchecActus } from "./actus-regles.ts";
import type { PhotosActus } from "./photos-actus.ts";

type BaseActusAuteur = Pick<typeof baseDeDonnees, "$transaction" | "articleActus" | "jaimeArticleActus" | "lieu" | "rattachementLieu">;

export type ActusAuteur = ReturnType<typeof creerActusAuteur>;

const MES_ARTICLES_MAX = 100;

export function creerActusAuteur(photos: Pick<PhotosActus, "verifier">, base: BaseActusAuteur = baseDeDonnees, horloge: () => number = Date.now) {
  const adresseDeMonImage = (nom: string, statut: string) => (statut === "publie" ? ecrireAdresseImageActus(nom) : `${CHEMIN_MES_MEDIAS_ACTUS}/${nom}`);

  async function preparer(compteId: number, corps: CorpsArticleActus, articleId: number | null): Promise<{ ok: true; article: ArticleEnvoyeActus; alcool: boolean } | EchecActus> {
    const validation = validerArticleActus(
      { ...corps, couverture: corps.couverture.length > 0, photos: corps.photos.length },
      calculerJourParis(horloge()),
    );
    if (!validation.ok) return echecActus("article-invalide", validation.champs);
    if (!(await photos.verifier([corps.couverture, ...corps.photos], compteId, articleId))) return echecActus("photo-actus-introuvable");
    const lieux = await base.lieu.findMany({ where: { id: { in: validation.article.lieux }, statut: "publie" }, select: { id: true, type: true } });
    if (lieux.length !== validation.article.lieux.length) return echecActus("lieu-inconnu");
    const membre = await base.rattachementLieu.count({ where: { compteId, lieuId: { in: validation.article.lieux }, statut: { in: ["valide", "en-attente"] } } });
    if (membre > 0) return echecActus("membre-du-lieu");
    return { ok: true, article: validation.article, alcool: detecterAlcoolActus(validation.article, lieux.map((l) => l.type)) };
  }

  const colonnes = (article: ArticleEnvoyeActus, corps: CorpsArticleActus, alcool: boolean) => ({
    rubrique: article.rubrique,
    titre: article.titre,
    accroche: article.accroche,
    texte: article.paragraphes.join("\n\n"),
    citation: article.citation,
    couverture: corps.couverture,
    photos: corps.photos,
    collaboration: article.collaboration,
    alcool,
    finLe: article.finLe ? new Date(`${article.finLe}T00:00:00Z`) : null,
  });

  const lieuxEnOrdre = (article: ArticleEnvoyeActus) => article.lieux.map((lieuId, rang) => ({ lieuId, rang: rang + 1 }));

  const compterSemaine = (tx: Pick<Prisma.TransactionClient, "articleActus">, compteId: number) =>
    tx.articleActus.count({ where: { auteurId: compteId, envoyeLe: { gte: new Date(calculerDernierLundiParis(horloge())) } } });

  return {
    async envoyer(compteId: number, corps: CorpsArticleActus): Promise<{ ok: true; id: number } | EchecActus> {
      const pret = await preparer(compteId, corps, null);
      if (!pret.ok) return pret;
      return base.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM comptes WHERE id = ${compteId} FOR NO KEY UPDATE`;
        if ((await compterSemaine(tx, compteId)) >= ARTICLES_ACTUS_PAR_SEMAINE) return echecActus("limite-actus-semaine");
        const cree = await tx.articleActus.create({
          data: { auteurId: compteId, ...colonnes(pret.article, corps, pret.alcool), envoyeLe: new Date(horloge()), lieux: { create: lieuxEnOrdre(pret.article) } },
          select: { id: true },
        });
        return { ok: true as const, id: cree.id };
      });
    },

    async retoucher(compteId: number, id: number, corps: CorpsArticleActus): Promise<{ ok: true } | EchecActus> {
      const actuel = await base.articleActus.findFirst({ where: { id, auteurId: compteId }, select: { statut: true, rubrique: true } });
      if (!actuel) return echecActus("introuvable");
      if (actuel.statut !== "a-retoucher" || actuel.rubrique !== corps.rubrique) return echecActus("transition-interdite");
      const pret = await preparer(compteId, corps, id);
      if (!pret.ok) return pret;
      return base.$transaction(async (tx) => {
        const fait = await tx.articleActus.updateMany({
          where: { id, auteurId: compteId, statut: "a-retoucher" },
          data: { ...colonnes(pret.article, corps, pret.alcool), statut: "en-relecture", renvoye: true },
        });
        if (fait.count === 0) return echecActus("transition-interdite");
        await tx.lieuArticleActus.deleteMany({ where: { articleId: id } });
        await tx.lieuArticleActus.createMany({ data: lieuxEnOrdre(pret.article).map((l) => ({ ...l, articleId: id })) });
        return { ok: true as const };
      });
    },

    async mesArticles(compteId: number): Promise<{ articles: MonArticleActus[]; envoyesCetteSemaine: number }> {
      const [lignes, envoyesCetteSemaine] = await Promise.all([
        base.articleActus.findMany({
          where: { auteurId: compteId },
          orderBy: [{ envoyeLe: "desc" }, { id: "desc" }],
          take: MES_ARTICLES_MAX,
          select: {
            id: true, rubrique: true, titre: true, couverture: true, statut: true, envoyeLe: true, publieLe: true,
            retoucheMessage: true, retoucheLe: true, refusMotif: true, refusMotivation: true, refusLe: true,
            _count: { select: { jaimes: true, reponses: { where: { statut: "publie" } } } },
          },
        }),
        compterSemaine(base, compteId),
      ]);
      return {
        envoyesCetteSemaine,
        articles: lignes.map((l) => ({
          id: l.id,
          rubrique: l.rubrique as RubriqueActus,
          titre: l.titre,
          couverture: adresseDeMonImage(l.couverture, l.statut),
          statut: l.statut as StatutArticleActus,
          envoyeLe: l.envoyeLe.toISOString(),
          publieLe: l.publieLe?.toISOString() ?? null,
          retouche: l.statut === "a-retoucher" && l.retoucheMessage && l.retoucheLe ? { message: l.retoucheMessage, le: l.retoucheLe.toISOString() } : null,
          refus: l.statut === "refuse" && l.refusMotif && l.refusMotivation && l.refusLe
            ? { motif: l.refusMotif as MotifModeration, motivation: l.refusMotivation, le: l.refusLe.toISOString() }
            : null,
          jaime: l._count.jaimes,
          commentaires: 0,
          lieuARepondu: l._count.reponses > 0,
        })),
      };
    },

    async lireBrouillon(compteId: number, id: number): Promise<BrouillonRetoucheActus | null> {
      const l = await base.articleActus.findFirst({
        where: { id, auteurId: compteId, statut: "a-retoucher" },
        select: {
          rubrique: true, titre: true, accroche: true, texte: true, citation: true, couverture: true, photos: true, collaboration: true, finLe: true,
          retoucheMessage: true, lieux: { orderBy: { rang: "asc" }, select: { lieuId: true } },
        },
      });
      if (!l) return null;
      return {
        rubrique: l.rubrique as RubriqueActus,
        titre: l.titre,
        accroche: l.accroche,
        texte: l.texte,
        citation: l.citation ?? "",
        couverture: l.couverture,
        photos: l.photos,
        lieux: l.lieux.map((x) => x.lieuId),
        collaboration: l.collaboration,
        finLe: l.finLe ? l.finLe.toISOString().slice(0, 10) : null,
        adresses: { couverture: adresseDeMonImage(l.couverture, "a-retoucher"), photos: l.photos.map((p) => adresseDeMonImage(p, "a-retoucher")) },
        retouche: l.retoucheMessage,
      };
    },
  };
}
