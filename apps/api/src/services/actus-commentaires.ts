import { COMMENTAIRE_ACTUS_MAX, COMMENTAIRES_ACTUS_PAR_PAGE } from "../../../../packages/commun/src/regles/actus.ts";
import { DUREE_CONTESTATION_JOURS } from "../../../../packages/commun/src/regles/signalement.ts";
import type { CommentaireActus } from "../../../../packages/commun/src/types/actus.ts";
import { contientMotInterdit } from "../../../../packages/commun/src/validation/contient-mot-interdit.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { lireAvatarAuteurActus } from "../fonctions/actus/lire-avatar-auteur-actus.ts";
import { echecActus, type EchecActus } from "./actus-regles.ts";

type BaseCommentairesActus = Pick<typeof baseDeDonnees, "articleActus" | "commentaireArticleActus">;

export type ActusCommentaires = ReturnType<typeof creerActusCommentaires>;

const JOUR_MS = 86_400_000;

const SELECTION = {
  id: true, auteurId: true, texte: true, creeLe: true, reponseAId: true, supprimeLe: true,
  auteur: { select: { prenom: true, avatar: true, ambassadeur: { select: { statut: true } } } },
} satisfies Prisma.CommentaireArticleActusSelect;

type LigneCommentaire = Prisma.CommentaireArticleActusGetPayload<{ select: typeof SELECTION }>;

const SANS_ALCOOL: Prisma.ArticleActusWhereInput = { alcool: false, lieux: { none: { lieu: { type: "bar" } } } };

function presenter(c: LigneCommentaire, auteurArticleId: number, compteId: number | null): CommentaireActus {
  return {
    id: c.id,
    auteur: { id: 0, prenom: c.auteur.prenom, avatar: lireAvatarAuteurActus(c.auteur.avatar), ambassadeur: c.auteur.ambassadeur?.statut === "actif" },
    texte: c.supprimeLe ? "" : c.texte,
    ecritLe: c.creeLe.toISOString(),
    reponseA: c.reponseAId,
    plume: c.auteurId === auteurArticleId,
    supprime: c.supprimeLe !== null,
    ...(compteId === null ? {} : { mien: c.auteurId === compteId }),
  };
}

export function creerActusCommentaires(base: BaseCommentairesActus = baseDeDonnees, horloge: () => number = Date.now) {
  const lireArticle = (id: number, avecAlcool: boolean) =>
    base.articleActus.findFirst({ where: { id, statut: "publie", ...(avecAlcool ? {} : SANS_ALCOOL) }, select: { id: true, auteurId: true } });

  return {
    async lister(articleId: number, o: { apres: number | null; avecAlcool: boolean; compteId: number | null }): Promise<{ commentaires: CommentaireActus[]; suite: number | null } | null> {
      const article = await lireArticle(articleId, o.avecAlcool);
      if (!article) return null;
      const lignes = await base.commentaireArticleActus.findMany({
        where: {
          articleId, retireLe: null,
          ...(o.apres ? { id: { gt: o.apres } } : {}),
          OR: [{ supprimeLe: null }, { reponses: { some: { supprimeLe: null, retireLe: null } } }],
        },
        orderBy: { id: "asc" },
        take: COMMENTAIRES_ACTUS_PAR_PAGE + 1,
        select: SELECTION,
      });
      const page = lignes.slice(0, COMMENTAIRES_ACTUS_PAR_PAGE);
      return {
        commentaires: page.map((c) => presenter(c, article.auteurId, o.compteId)),
        suite: lignes.length > COMMENTAIRES_ACTUS_PAR_PAGE ? page.at(-1)!.id : null,
      };
    },

    async commenter(compteId: number, articleId: number, brut: unknown, reponseA: unknown): Promise<{ ok: true; commentaire: CommentaireActus } | EchecActus> {
      const texte = typeof brut === "string" ? brut.trim() : "";
      if (texte.length === 0 || texte.length > COMMENTAIRE_ACTUS_MAX || contientMotInterdit(texte)) return echecActus("message-refuse");
      const article = await lireArticle(articleId, true);
      if (!article) return echecActus("introuvable");
      let parent: number | null = null;
      if (reponseA !== null && reponseA !== undefined) {
        if (typeof reponseA !== "number" || !Number.isSafeInteger(reponseA)) return echecActus("introuvable");
        const cible = await base.commentaireArticleActus.findFirst({ where: { id: reponseA, articleId, supprimeLe: null, retireLe: null }, select: { id: true, reponseAId: true } });
        if (!cible) return echecActus("introuvable");
        parent = cible.reponseAId ?? cible.id;
      }
      const cree = await base.commentaireArticleActus.create({ data: { articleId, auteurId: compteId, texte, reponseAId: parent, creeLe: new Date(horloge()) }, select: SELECTION });
      return { ok: true, commentaire: presenter(cree, article.auteurId, compteId) };
    },

    async supprimer(compteId: number, commentaireId: number): Promise<{ ok: true } | EchecActus> {
      const c = await base.commentaireArticleActus.findFirst({
        where: { id: commentaireId, auteurId: compteId, supprimeLe: null },
        select: { id: true, _count: { select: { reponses: true } } },
      });
      if (!c) return echecActus("introuvable");
      if (c._count.reponses === 0) await base.commentaireArticleActus.delete({ where: { id: c.id } });
      else await base.commentaireArticleActus.update({ where: { id: c.id }, data: { texte: "", supprimeLe: new Date(horloge()) } });
      return { ok: true };
    },

    async menager(maintenant = new Date(horloge())): Promise<number> {
      const avant = new Date(maintenant.getTime() - DUREE_CONTESTATION_JOURS * JOUR_MS);
      const { count } = await base.commentaireArticleActus.deleteMany({ where: { retireLe: { lt: avant } } });
      return count;
    },
  };
}
