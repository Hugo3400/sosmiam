// Double EN MÉMOIRE des commentaires des publications (pour les tests), posé sur les tables partagées
// (tables-sociales-en-memoire.ts) : mêmes règles que commentaires.ts (visibilité, un seul niveau de réponses, mentions,
// réponse du lieu, « Commentaire supprimé », masquage par le lieu avec son signalement et son instantané).
import type { CommentairePublication } from "../base-de-donnees/client-genere/client.ts";
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import { lireMentionsCommentaire } from "../fonctions/social/lire-mentions-commentaire.ts";
import { presenterCommentaire } from "../fonctions/social/presenter-commentaire.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import {
  COMMENTAIRES_PAR_PAGE, ecrireEffetsCommentaire, EXPLICATION_MASQUE_PAR_LIEU, retrouverMentions, voitCommentaire, type ServicesCommentaires,
} from "./commentaires-regles.ts";
import type { RoleRattachement } from "./pro-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import {
  compterRejetsEnMemoire, ecrireSignalementSocialEnMemoire, lireContenuSignaleEnMemoire, publicationVisibleEnMemoire,
} from "./signalements-sociaux-en-memoire.ts";
import { ecrireEffetMasque } from "./signalements-sociaux-regles.ts";
import type { ServicesSocial } from "./social-regles.ts";
import { prendreId, type TablesSociales } from "./tables-sociales-en-memoire.ts";

export type OptionsCommentairesEnMemoire = {
  relations: RelationsSociales;
  social: Pick<ServicesSocial, "trouverMentions">;
  lireRole: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
  chiffrement: ChiffrementSocial | null;
};

const estPublic = (c: CommentairePublication) => !c.supprimeLe && !c.masqueParLieuLe && !c.suspenduLe && !c.retireLe;
/** Plus récent d'abord ; à la même milliseconde, le plus grand id */
const plusRecentDabord = (a: CommentairePublication, b: CommentairePublication) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id;

export function creerCommentairesEnMemoire(tables: TablesSociales, o: OptionsCommentairesEnMemoire): ServicesCommentaires {
  const { relations } = o;
  const estGerant = async (compteId: number, lieuId: number) => (await o.lireRole(compteId, lieuId)) === "gerant";
  const bloqueAvec = async (compteId: number, auteurId: number | null) => auteurId !== null && auteurId !== compteId && (await relations.bloqueEntre(compteId, auteurId));
  const tous = () => [...tables.commentaires.values()];
  const compterJaimes = (id: number) => tables.jaimesCommentaires.filter((j) => j.commentaireId === id).length;

  async function presenter(lignes: readonly CommentairePublication[], o2: { avecEtat?: boolean } = {}) {
    const personnes = await relations.presenter(lignes.flatMap((c) => (c.auteurId === null ? [] : [c.auteurId])));
    return lignes.flatMap((c) => {
      const commentaire = presenterCommentaire({ ...c, jaimes: compterJaimes(c.id) }, c.auteurId === null ? null : personnes.get(c.auteurId) ?? null, o2);
      return commentaire ? [commentaire] : [];
    });
  }

  return {
    async listerPublics(publicationId, apres) {
      if (!publicationVisibleEnMemoire(tables, publicationId)) return null;
      const curseur = lireCurseurDate(apres) ?? null;
      const dela = tous().filter((c) => c.publicationId === publicationId);
      const visibles = dela
        .filter((c) => estPublic(c) || (c.supprimeLe && !c.masqueParLieuLe && !c.suspenduLe && !c.retireLe && dela.some((r) => r.reponseAId === c.id && estPublic(r))))
        .filter((c) => !curseur || c.creeLe < curseur.date || (c.creeLe.getTime() === curseur.date.getTime() && c.id < curseur.id))
        .sort(plusRecentDabord);
      const page = visibles.slice(0, COMMENTAIRES_PAR_PAGE);
      const derniere = page[page.length - 1];
      return {
        commentaires: await presenter(page),
        total: dela.filter(estPublic).length,
        suite: visibles.length > COMMENTAIRES_PAR_PAGE && derniere ? ecrireCurseurDate(derniere.creeLe, derniere.id) : null,
      };
    },

    async lireMiens(compteId, publicationId) {
      const publication = publicationVisibleEnMemoire(tables, publicationId);
      if (!publication) return null;
      const dela = new Set(tous().filter((c) => c.publicationId === publicationId).map((c) => c.id));
      const miens = tous().filter((c) => c.publicationId === publicationId && c.auteurId === compteId && !c.supprimeLe && !c.retireLe && (c.masqueParLieuLe || c.suspenduLe)).sort(plusRecentDabord);
      const signales = [...tables.signalements.values()]
        .filter((s) => s.signaleParId === compteId && s.cible === "commentaire" && s.source === "app" && dela.has(Number(s.cibleId)))
        .map((s) => s.cibleId);
      return {
        jaimes: tables.jaimesCommentaires.filter((j) => j.compteId === compteId && dela.has(j.commentaireId)).map((j) => String(j.commentaireId)),
        miens: await presenter(miens, { avecEtat: true }),
        signales: [...new Set(signales)],
        peutRepondreCommeLieu: await estGerant(compteId, publication.lieuId),
      };
    },

    async commenter(compteId, publicationId, c, maintenant) {
      const publication = publicationVisibleEnMemoire(tables, publicationId);
      if (!publication) return { ok: false, erreur: "publication-inconnue" };
      let reponseAId: number | null = null;
      let parentAuteurId: number | null = null;
      if (c.reponseA !== null) {
        const parent = tables.commentaires.get(c.reponseA);
        if (!parent || parent.publicationId !== publicationId || !estPublic(parent) || (await bloqueAvec(compteId, parent.auteurId))) {
          return { ok: false, erreur: "commentaire-inconnu" };
        }
        // Comme la base : le commentaire du haut doit se voir (public, ou « Commentaire supprimé » sans autre état), sans blocage
        const haut = parent.reponseAId === null ? null : tables.commentaires.get(parent.reponseAId);
        if (parent.reponseAId !== null && (!haut || haut.publicationId !== publicationId || haut.masqueParLieuLe || haut.suspenduLe || haut.retireLe || (await bloqueAvec(compteId, haut.auteurId)))) {
          return { ok: false, erreur: "commentaire-inconnu" };
        }
        reponseAId = parent.reponseAId ?? parent.id;
        parentAuteurId = parent.auteurId;
      }
      if (c.commeLieu && !(await estGerant(compteId, publication.lieuId))) return { ok: false, erreur: "reserve-au-gerant" };
      const mentions = await retrouverMentions(o.social, compteId, c.texte);
      const ligne: CommentairePublication = {
        id: prendreId(tables, "commentaires"), publicationId, auteurId: c.commeLieu ? null : compteId, commeLieuId: c.commeLieu ? publication.lieuId : null,
        ecritParId: c.commeLieu ? compteId : null, texte: c.texte, mentions, reponseAId, creeLe: maintenant, modifieLe: null, supprimeLe: null,
        masqueParLieuLe: null, suspenduLe: null, retireLe: null,
      };
      tables.commentaires.set(ligne.id, ligne);
      const [commentaire] = await presenter([ligne]);
      const effets = await ecrireEffetsCommentaire(relations, { auteurId: compteId, commeLieu: c.commeLieu, publicationId, nouvellesMentions: mentions.map((m) => m.id), parentAuteurId });
      return { ok: true, commentaire: commentaire!, effets };
    },

    async modifier(compteId, commentaireId, texte, maintenant) {
      const c = tables.commentaires.get(commentaireId);
      if (!c || !publicationVisibleEnMemoire(tables, c.publicationId) || !voitCommentaire(c, compteId)) return { ok: false, erreur: "commentaire-inconnu" };
      if (!(c.auteurId === compteId || (c.commeLieuId !== null && (await estGerant(compteId, c.commeLieuId))))) return { ok: false, erreur: "reserve-a-l-auteur" };
      const mentions = await retrouverMentions(o.social, compteId, texte);
      const anciennes = new Set(lireMentionsCommentaire(c.mentions).map((m) => m.id));
      Object.assign(c, { texte, mentions, modifieLe: maintenant });
      const [commentaire] = await presenter([c]);
      const effets = await ecrireEffetsCommentaire(relations, {
        auteurId: compteId, commeLieu: c.commeLieuId !== null, publicationId: c.publicationId,
        nouvellesMentions: mentions.map((m) => m.id).filter((id) => !anciennes.has(id)), parentAuteurId: null,
      });
      return { ok: true, commentaire: commentaire!, effets };
    },

    async supprimer(compteId, commentaireId, maintenant) {
      const c = tables.commentaires.get(commentaireId);
      if (!c || c.supprimeLe) return { ok: false, erreur: "commentaire-inconnu" };
      if (!(c.auteurId === compteId || (c.commeLieuId !== null && (await estGerant(compteId, c.commeLieuId))))) {
        return { ok: false, erreur: voitCommentaire(c, compteId) && publicationVisibleEnMemoire(tables, c.publicationId) ? "reserve-a-l-auteur" : "commentaire-inconnu" };
      }
      const reponses = tous().some((r) => r.reponseAId === commentaireId);
      const ouvert = [...tables.signalements.values()].some((s) =>
        s.cible === "commentaire" && s.cibleId === String(commentaireId) && (s.statut === "a-traiter" || (s.contesteLe !== null && s.reexamineLe === null)));
      if (reponses || ouvert) {
        Object.assign(c, { supprimeLe: maintenant, texte: "", mentions: [] });
        return { ok: true };
      }
      // Comme la base : ses J'aime partent avec lui
      tables.commentaires.delete(commentaireId);
      for (let i = tables.jaimesCommentaires.length - 1; i >= 0; i--) if (tables.jaimesCommentaires[i]!.commentaireId === commentaireId) tables.jaimesCommentaires.splice(i, 1);
      return { ok: true };
    },

    async basculerJaime(compteId, commentaireId, oui, maintenant) {
      const c = tables.commentaires.get(commentaireId);
      if (!c || !publicationVisibleEnMemoire(tables, c.publicationId) || !voitCommentaire(c, compteId)) return { ok: false, erreur: "commentaire-inconnu" };
      if (await bloqueAvec(compteId, c.auteurId)) return { ok: false, erreur: "commentaire-inconnu" };
      const deja = tables.jaimesCommentaires.findIndex((j) => j.commentaireId === commentaireId && j.compteId === compteId);
      if (oui && deja < 0) tables.jaimesCommentaires.push({ commentaireId, compteId, creeLe: maintenant });
      if (!oui && deja >= 0) tables.jaimesCommentaires.splice(deja, 1);
      return { ok: true, jaimes: compterJaimes(commentaireId) };
    },

    async masquerParLieu(compteId, commentaireId, masque, maintenant) {
      const c = tables.commentaires.get(commentaireId);
      const publication = c ? publicationVisibleEnMemoire(tables, c.publicationId) : null;
      if (!c || !publication || c.supprimeLe || c.retireLe || c.suspenduLe || c.auteurId === null || c.auteurId === compteId) return { ok: false, erreur: "commentaire-inconnu" };
      if (!(await estGerant(compteId, publication.lieuId))) return { ok: false, erreur: c.masqueParLieuLe ? "commentaire-inconnu" : "reserve-au-gerant" };
      if (!masque) {
        c.masqueParLieuLe = null;
        return { ok: true, effets: [] };
      }
      if (c.masqueParLieuLe) return { ok: true, effets: [] };
      const chiffrement = o.chiffrement;
      if (!chiffrement) throw new Error("Masquage par le lieu sans clé des données");
      const lu = await lireContenuSignaleEnMemoire(tables, { chiffrement, relations }, compteId, "commentaire", String(commentaireId), maintenant, { pourLeLieu: true });
      if (!lu) return { ok: false, erreur: "commentaire-inconnu" };
      if (compterRejetsEnMemoire(tables, "commentaire", String(commentaireId), "lieu") > 0) return { ok: false, erreur: "deja-examine" };
      const ouvert = [...tables.signalements.values()].find((s) => s.cible === "commentaire" && s.cibleId === String(commentaireId) && s.source === "lieu" && s.statut === "a-traiter");
      const signalementId = ouvert?.id ?? ecrireSignalementSocialEnMemoire(tables, chiffrement, {
        cible: "commentaire", cibleId: String(commentaireId), raison: "autre", precision: null, explication: EXPLICATION_MASQUE_PAR_LIEU,
        signaleParId: compteId, auteurContenuId: lu.auteurContenuId, lieuId: lu.lieuId, source: "lieu", fichierMedia: null,
      }, lu.contenu, maintenant);
      c.masqueParLieuLe = maintenant;
      return { ok: true, effets: ecrireEffetMasque(lu.auteurContenuId, signalementId, "masque-par-le-lieu") };
    },
  };
}
