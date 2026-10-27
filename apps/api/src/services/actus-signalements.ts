import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

type BaseSignalementsActus = Pick<typeof baseDeDonnees, "articleActus" | "reponseLieuActus" | "commentaireArticleActus" | "signalement">;

export type SignalementActusRecu = {
  cible: "article-actu" | "reponse-actu" | "comment-actu";
  articleId: number;
  lieuId: number | null;
  commentaireId: number | null;
  raison: string;
  precision: string | null;
  explication: string;
  signaleParId: number | null;
  source: "app" | "site";
};

export type IssueSignalementActus = "enregistre" | "introuvable" | "deja-signale";

async function lireCommentaire(s: SignalementActusRecu, base: BaseSignalementsActus) {
  if (s.commentaireId === null) return null;
  const c = await base.commentaireArticleActus.findFirst({
    where: { id: s.commentaireId, articleId: s.articleId, supprimeLe: null, retireLe: null, article: { statut: "publie" } },
    select: { id: true, auteurId: true, article: { select: { lieux: { orderBy: { rang: "asc" }, take: 1, select: { lieuId: true } } } } },
  });
  return c ? { id: c.id, auteurId: c.auteurId as number | null, lieuId: c.article.lieux[0]?.lieuId ?? null } : null;
}

export async function enregistrerSignalementActus(s: SignalementActusRecu, base: BaseSignalementsActus = baseDeDonnees): Promise<IssueSignalementActus> {
  const cible = s.cible === "comment-actu" ? await lireCommentaire(s, base) : s.cible === "article-actu"
    ? await base.articleActus.findFirst({ where: { id: s.articleId, statut: "publie" }, select: { id: true, auteurId: true, lieux: { orderBy: { rang: "asc" }, take: 1, select: { lieuId: true } } } })
      .then((a) => (a ? { id: a.id, auteurId: a.auteurId as number | null, lieuId: a.lieux[0]?.lieuId ?? null } : null))
    : s.lieuId === null
      ? null
      : await base.reponseLieuActus.findFirst({ where: { articleId: s.articleId, lieuId: s.lieuId, statut: "publie" }, select: { id: true, ecritParId: true, lieuId: true } })
        .then((r) => (r ? { id: r.id, auteurId: r.ecritParId, lieuId: r.lieuId } : null));
  if (!cible) return "introuvable";
  if (s.signaleParId !== null) {
    const deja = await base.signalement.count({ where: { cible: s.cible, cibleId: String(cible.id), signaleParId: s.signaleParId, statut: "a-traiter" } });
    if (deja > 0) return "deja-signale";
  }
  await base.signalement.create({
    data: {
      cible: s.cible, cibleId: String(cible.id), lieuId: cible.lieuId, raison: s.raison, precision: s.precision, explication: s.explication,
      source: s.source, signaleParId: s.signaleParId, auteurContenuId: cible.auteurId,
    },
  });
  return "enregistre";
}
