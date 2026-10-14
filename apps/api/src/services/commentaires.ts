// Les commentaires des publications, dans la base (contrat et règles de visibilité dans commentaires-regles.ts). Seulement
// sous une publication visible (filtrePublicationVisible, la même règle que le fil) ; l'id d'un compte ne sort jamais d'ici
// (les personnes sont présentées par leur identifiant public, la réponse du lieu est signée « le lieu »).
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { lireMentionsCommentaire } from "../fonctions/social/lire-mentions-commentaire.ts";
import { presenterCommentaire, type LigneCommentaire } from "../fonctions/social/presenter-commentaire.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import {
  COMMENTAIRE_VISIBLE_PUBLIC, COMMENTAIRES_PAR_PAGE, ecrireEffetsCommentaire, EXPLICATION_MASQUE_PAR_LIEU, retrouverMentions, voitCommentaire,
  type ServicesCommentaires,
} from "./commentaires-regles.ts";
import { SIGNALEMENT_OUVERT } from "./effacer-conversations.ts";
import { compterRejets, ecrireSignalementSocial, lireContenuSignale } from "./instantanes-signalements.ts";
import type { RoleRattachement } from "./pro-regles.ts";
import { filtrePublicationVisible } from "./publications-app.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { ecrireEffetMasque } from "./signalements-sociaux-regles.ts";
import type { ServicesSocial } from "./social-regles.ts";

export type OptionsCommentaires = {
  relations: RelationsSociales;
  social: Pick<ServicesSocial, "trouverMentions">;
  /** servicesPro.lireRole : le gérant du lieu de la publication répond et masque au nom du lieu */
  lireRole: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
  /** Pour l'instantané d'un commentaire masqué par le lieu ; null : PUT …/masque répond 503 avant d'arriver ici */
  chiffrement: ChiffrementSocial | null;
};

const SELECTION = {
  id: true, publicationId: true, auteurId: true, commeLieuId: true, texte: true, mentions: true, reponseAId: true, creeLe: true, modifieLe: true,
  supprimeLe: true, masqueParLieuLe: true, suspenduLe: true, retireLe: true, _count: { select: { jaimes: true } },
} as const;
type LigneLue = Omit<LigneCommentaire, "jaimes"> & { retireLe: Date | null; _count: { jaimes: number } };
const enLigne = ({ _count, ...c }: LigneLue): LigneCommentaire & { retireLe: Date | null } => ({ ...c, jaimes: _count.jaimes });

export function creerCommentaires(o: OptionsCommentaires, base = baseDeDonnees): ServicesCommentaires {
  const { relations } = o;
  const estGerant = async (compteId: number, lieuId: number) => (await o.lireRole(compteId, lieuId)) === "gerant";
  /** Un blocage, dans un sens ou dans l'autre, avec l'auteur d'un commentaire (une réponse du lieu, ou le sien : jamais) */
  const bloqueAvec = async (compteId: number, auteurId: number | null) => auteurId !== null && auteurId !== compteId && (await relations.bloqueEntre(compteId, auteurId));
  const lirePublication = (id: number, maintenant: Date) =>
    base.publication.findFirst({ where: { id, ...filtrePublicationVisible(maintenant) }, select: { id: true, lieuId: true } });

  /** Les commentaires au format de l'app ; ceux d'une personne qu'on ne peut plus présenter ne sortent pas */
  async function presenter(lignes: readonly LigneLue[], o2: { avecEtat?: boolean } = {}) {
    const personnes = await relations.presenter(lignes.flatMap((c) => (c.auteurId === null ? [] : [c.auteurId])));
    return lignes.flatMap((c) => {
      const commentaire = presenterCommentaire(enLigne(c), c.auteurId === null ? null : personnes.get(c.auteurId) ?? null, o2);
      return commentaire ? [commentaire] : [];
    });
  }

  async function presenterUn(id: number) {
    const ligne = await base.commentairePublication.findUnique({ where: { id }, select: SELECTION });
    return ligne ? (await presenter([ligne]))[0] ?? null : null;
  }

  return {
    async listerPublics(publicationId, apres, maintenant) {
      if (!(await lirePublication(publicationId, maintenant))) return null;
      const curseur = lireCurseurDate(apres) ?? null;
      // Un commentaire supprimé reste en « Commentaire supprimé » tant qu'il a une réponse visible
      const visibles = {
        publicationId,
        OR: [COMMENTAIRE_VISIBLE_PUBLIC, { supprimeLe: { not: null }, masqueParLieuLe: null, suspenduLe: null, retireLe: null, reponses: { some: COMMENTAIRE_VISIBLE_PUBLIC } }],
      };
      const [lignes, total] = await Promise.all([
        base.commentairePublication.findMany({
          where: { AND: [visibles, ...(curseur ? [{ OR: [{ creeLe: { lt: curseur.date } }, { creeLe: curseur.date, id: { lt: curseur.id } }] }] : [])] },
          select: SELECTION,
          orderBy: [{ creeLe: "desc" }, { id: "desc" }],
          take: COMMENTAIRES_PAR_PAGE + 1,
        }),
        base.commentairePublication.count({ where: { publicationId, ...COMMENTAIRE_VISIBLE_PUBLIC } }),
      ]);
      const page = lignes.slice(0, COMMENTAIRES_PAR_PAGE);
      const derniere = page[page.length - 1];
      return { commentaires: await presenter(page), total, suite: lignes.length > COMMENTAIRES_PAR_PAGE && derniere ? ecrireCurseurDate(derniere.creeLe, derniere.id) : null };
    },

    async lireMiens(compteId, publicationId, maintenant) {
      const publication = await lirePublication(publicationId, maintenant);
      if (!publication) return null;
      const [jaimes, miens, signalements, gerant] = await Promise.all([
        base.jaimeCommentaire.findMany({ where: { compteId, commentaire: { publicationId } }, select: { commentaireId: true } }),
        base.commentairePublication.findMany({
          where: { publicationId, auteurId: compteId, supprimeLe: null, retireLe: null, OR: [{ masqueParLieuLe: { not: null } }, { suspenduLe: { not: null } }] },
          select: SELECTION,
          orderBy: [{ creeLe: "desc" }, { id: "desc" }],
        }),
        base.signalement.findMany({ where: { signaleParId: compteId, cible: "commentaire", source: "app" }, select: { cibleId: true }, orderBy: { id: "desc" }, take: 2000 }),
        estGerant(compteId, publication.lieuId),
      ]);
      const ids = signalements.map((s) => Number(s.cibleId)).filter(Number.isSafeInteger);
      const signales = ids.length === 0 ? [] : await base.commentairePublication.findMany({ where: { publicationId, id: { in: ids } }, select: { id: true } });
      return {
        jaimes: jaimes.map((j) => String(j.commentaireId)),
        miens: await presenter(miens, { avecEtat: true }),
        signales: signales.map((s) => String(s.id)),
        peutRepondreCommeLieu: gerant,
      };
    },

    async commenter(compteId, publicationId, c, maintenant) {
      const publication = await lirePublication(publicationId, maintenant);
      if (!publication) return { ok: false, erreur: "publication-inconnue" };
      let reponseAId: number | null = null;
      let parentAuteurId: number | null = null;
      if (c.reponseA !== null) {
        const parent = await base.commentairePublication.findFirst({
          where: { id: c.reponseA, publicationId, ...COMMENTAIRE_VISIBLE_PUBLIC }, select: { id: true, auteurId: true, reponseAId: true },
        });
        if (!parent || (await bloqueAvec(compteId, parent.auteurId))) return { ok: false, erreur: "commentaire-inconnu" };
        // Un seul niveau : répondre à une réponse, c'est répondre sous son commentaire. Celui-ci doit donc se voir lui aussi
        // (public, ou « Commentaire supprimé » sans autre état) et sans blocage avec son auteur : on ne contourne ni un
        // blocage ni un masquage en passant par une de ses réponses
        if (parent.reponseAId !== null) {
          const haut = await base.commentairePublication.findFirst({
            where: { id: parent.reponseAId, publicationId, masqueParLieuLe: null, suspenduLe: null, retireLe: null }, select: { auteurId: true },
          });
          if (!haut || (await bloqueAvec(compteId, haut.auteurId))) return { ok: false, erreur: "commentaire-inconnu" };
        }
        reponseAId = parent.reponseAId ?? parent.id;
        parentAuteurId = parent.auteurId;
      }
      if (c.commeLieu && !(await estGerant(compteId, publication.lieuId))) return { ok: false, erreur: "reserve-au-gerant" };
      const mentions = await retrouverMentions(o.social, compteId, c.texte);
      const { id } = await base.commentairePublication.create({
        data: {
          publicationId, texte: c.texte, mentions, reponseAId, creeLe: maintenant,
          ...(c.commeLieu ? { commeLieuId: publication.lieuId, ecritParId: compteId } : { auteurId: compteId }),
        },
        select: { id: true },
      });
      const commentaire = await presenterUn(id);
      if (!commentaire) throw new Error("Commentaire écrit mais introuvable");
      const effets = await ecrireEffetsCommentaire(relations, { auteurId: compteId, commeLieu: c.commeLieu, publicationId, nouvellesMentions: mentions.map((m) => m.id), parentAuteurId });
      return { ok: true, commentaire, effets };
    },

    async modifier(compteId, commentaireId, texte, maintenant) {
      // Sous une publication qui ne se voit plus : 404 pour tout le monde (comme la lecture, le J'aime et le masquage)
      const c = await base.commentairePublication.findFirst({ where: { id: commentaireId, publication: filtrePublicationVisible(maintenant) }, select: SELECTION });
      if (!c || !voitCommentaire(c, compteId)) return { ok: false, erreur: "commentaire-inconnu" };
      const autorise = c.auteurId === compteId || (c.commeLieuId !== null && (await estGerant(compteId, c.commeLieuId)));
      if (!autorise) return { ok: false, erreur: "reserve-a-l-auteur" };
      const mentions = await retrouverMentions(o.social, compteId, texte);
      const anciennes = new Set(lireMentionsCommentaire(c.mentions).map((m) => m.id));
      await base.commentairePublication.update({ where: { id: commentaireId }, data: { texte, mentions, modifieLe: maintenant } });
      const commentaire = await presenterUn(commentaireId);
      if (!commentaire) return { ok: false, erreur: "commentaire-inconnu" };
      const effets = await ecrireEffetsCommentaire(relations, {
        auteurId: compteId, commeLieu: c.commeLieuId !== null, publicationId: c.publicationId,
        nouvellesMentions: mentions.map((m) => m.id).filter((id) => !anciennes.has(id)), parentAuteurId: null,
      });
      return { ok: true, commentaire, effets };
    },

    async supprimer(compteId, commentaireId, maintenant) {
      const c = await base.commentairePublication.findFirst({ where: { id: commentaireId, supprimeLe: null }, select: SELECTION });
      if (!c) return { ok: false, erreur: "commentaire-inconnu" };
      // Le sien se supprime toujours (même masqué, retiré, ou sous une publication qui ne se voit plus) ; une réponse du lieu,
      // par le gérant du lieu. Les autres : 403 seulement pour un commentaire qu'ils voient (404 avant 403)
      const autorise = c.auteurId === compteId || (c.commeLieuId !== null && (await estGerant(compteId, c.commeLieuId)));
      if (!autorise) {
        const visible = voitCommentaire(c, compteId) && (await lirePublication(c.publicationId, maintenant)) !== null;
        return { ok: false, erreur: visible ? "reserve-a-l-auteur" : "commentaire-inconnu" };
      }
      await base.$transaction(async (tx) => {
        const [reponses, ouverts] = await Promise.all([
          tx.commentairePublication.count({ where: { reponseAId: commentaireId } }),
          tx.signalement.count({ where: { AND: [{ cible: "commentaire", cibleId: String(commentaireId) }, SIGNALEMENT_OUVERT] } }),
        ]);
        // Sans réponse ni signalement ouvert : effacé (ses J'aime avec). Sinon « Commentaire supprimé », texte et mentions
        // vidés (l'instantané du signalement garde le texte jugé), effacé pour de bon par le ménage de nuit
        if (reponses === 0 && ouverts === 0) await tx.commentairePublication.delete({ where: { id: commentaireId } });
        else await tx.commentairePublication.update({ where: { id: commentaireId }, data: { supprimeLe: maintenant, texte: "", mentions: [] } });
      });
      return { ok: true };
    },

    async basculerJaime(compteId, commentaireId, oui, maintenant) {
      const c = await base.commentairePublication.findFirst({ where: { id: commentaireId, publication: filtrePublicationVisible(maintenant) }, select: SELECTION });
      if (!c || !voitCommentaire(c, compteId)) return { ok: false, erreur: "commentaire-inconnu" };
      if (await bloqueAvec(compteId, c.auteurId)) return { ok: false, erreur: "commentaire-inconnu" };
      if (oui) await base.jaimeCommentaire.createMany({ data: [{ commentaireId, compteId, creeLe: maintenant }], skipDuplicates: true });
      else await base.jaimeCommentaire.deleteMany({ where: { commentaireId, compteId } });
      return { ok: true, jaimes: await base.jaimeCommentaire.count({ where: { commentaireId } }) };
    },

    async masquerParLieu(compteId, commentaireId, masque, maintenant) {
      const c = await base.commentairePublication.findFirst({
        where: { id: commentaireId, supprimeLe: null, retireLe: null, suspenduLe: null, publication: filtrePublicationVisible(maintenant) },
        select: { auteurId: true, masqueParLieuLe: true, publication: { select: { lieuId: true } } },
      });
      // Une réponse du lieu, ou son propre commentaire, ne se masque pas (on le supprime)
      if (!c || c.auteurId === null || c.auteurId === compteId) return { ok: false, erreur: "commentaire-inconnu" };
      const gerant = await estGerant(compteId, c.publication.lieuId);
      // Masqué par le lieu, il ne se voit plus que de son auteur et du gérant
      if (!gerant) return { ok: false, erreur: c.masqueParLieuLe ? "commentaire-inconnu" : "reserve-au-gerant" };
      if (!masque) {
        await base.commentairePublication.updateMany({ where: { id: commentaireId, masqueParLieuLe: { not: null } }, data: { masqueParLieuLe: null } });
        return { ok: true, effets: [] };
      }
      if (c.masqueParLieuLe) return { ok: true, effets: [] };
      const chiffrement = o.chiffrement;
      if (!chiffrement) throw new Error("Masquage par le lieu sans clé des données");
      return base.$transaction(async (tx) => {
        // Deux masquages en même temps : un seul signalement
        await tx.$queryRaw`SELECT id FROM commentaires_publications WHERE id = ${commentaireId} FOR UPDATE`;
        const lu = await lireContenuSignale(tx, { chiffrement, relations }, compteId, "commentaire", String(commentaireId), maintenant, { pourLeLieu: true });
        if (!lu || lu.contenu.cible !== "commentaire") return { ok: false as const, erreur: "commentaire-inconnu" as const };
        if (lu.contenu.masqueParLieu) return { ok: true as const, effets: [] };
        if ((await compterRejets(tx, "commentaire", String(commentaireId), "lieu")) > 0) return { ok: false as const, erreur: "deja-examine" as const };
        const ouvert = await tx.signalement.findFirst({ where: { cible: "commentaire", cibleId: String(commentaireId), source: "lieu", statut: "a-traiter" }, select: { id: true } });
        const signalementId = ouvert?.id ?? (await ecrireSignalementSocial(tx, chiffrement, {
          cible: "commentaire", cibleId: String(commentaireId), raison: "autre", precision: null, explication: EXPLICATION_MASQUE_PAR_LIEU,
          signaleParId: compteId, auteurContenuId: lu.auteurContenuId, lieuId: lu.lieuId, source: "lieu", fichierMedia: null,
        }, lu.contenu, maintenant));
        await tx.commentairePublication.update({ where: { id: commentaireId }, data: { masqueParLieuLe: maintenant } });
        return { ok: true as const, effets: ecrireEffetMasque(lu.auteurContenuId, signalementId, "masque-par-le-lieu") };
      });
    },
  };
}
