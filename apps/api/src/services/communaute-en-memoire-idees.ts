import type { StatutIdee } from "../../../../packages/commun/src/types/idees.ts";
import type { LigneCommentaireIdee, LigneIdee, TablesCommunaute } from "./communaute-regles.ts";
import type { TablesCommunauteEnMemoire } from "./communaute-en-memoire.ts";

export type IdeeEnMemoire = Omit<LigneIdee, "votes" | "aVote" | "commentaires"> & { titreCle: string };
export type CommentaireEnMemoire = Omit<LigneCommentaireIdee, "jaimes" | "aime">;

type TablesIdees = Pick<TablesCommunaute,
  "listerIdees" | "lireIdee" | "trouverIdeeParCle" | "creerIdee" | "effacerIdee" | "voterIdee" | "listerVotantsRecents" | "listerCommentaires" | "lireCommentaire"
  | "creerCommentaire" | "effacerCommentaire" | "aimerCommentaire" | "lireActiviteRecente">;

export function creerTablesIdeesEnMemoire(t: TablesCommunauteEnMemoire): TablesIdees {
  const versIdee = (i: IdeeEnMemoire, moi: number): LigneIdee => {
    const { titreCle: _cle, ...reste } = i;
    return {
      ...reste,
      votes: t.votes.filter((v) => v.ideeId === i.id).length,
      aVote: t.votes.some((v) => v.ideeId === i.id && v.compteId === moi),
      commentaires: [...t.commentaires.values()].filter((c) => c.ideeId === i.id && c.masqueLe === null && c.suspenduLe === null && c.retireLe === null).length,
    };
  };
  const versCommentaire = (c: CommentaireEnMemoire, moi: number): LigneCommentaireIdee => ({
    ...c, jaimes: t.jaimes.filter((j) => j.commentaireId === c.id).length, aime: t.jaimes.some((j) => j.commentaireId === c.id && j.compteId === moi),
  });
  const estPubliee = (i: IdeeEnMemoire) => i.statut !== "en-relecture" && i.suspendueLe === null && i.retireeLe === null;

  return {
    async listerIdees(moi, nombre) {
      return [...t.idees.values()].filter((i) => i.retireeLe === null && (estPubliee(i) || i.auteurId === moi)).map((i) => versIdee(i, moi))
        .sort((a, b) => b.votes - a.votes || b.creeLe.getTime() - a.creeLe.getTime()).slice(0, nombre);
    },
    async lireIdee(id, moi) {
      const i = t.idees.get(id);
      return i ? versIdee(i, moi) : null;
    },
    trouverIdeeParCle: async (titreCle) => [...t.idees.values()].find((i) => i.titreCle === titreCle)?.id ?? null,
    async creerIdee(auteurId, idee, titreCle, maintenant) {
      t.derniersIds.idees += 1;
      const id = t.derniersIds.idees;
      t.idees.set(id, {
        id, auteurId, titre: idee.titre, titreCle, detail: idee.detail, statut: "en-relecture" as StatutIdee, reponseBrigade: null, reponduLe: null, ideeDuMois: null,
        publieeLe: null, suspendueLe: null, retireeLe: null, creeLe: maintenant,
      });
      return id;
    },
    async effacerIdee(id) {
      t.idees.delete(id);
      t.votes = t.votes.filter((v) => v.ideeId !== id);
      const partis = new Set([...t.commentaires.values()].filter((c) => c.ideeId === id).map((c) => c.id));
      for (const cid of partis) t.commentaires.delete(cid);
      t.jaimes = t.jaimes.filter((j) => !partis.has(j.commentaireId));
    },
    async voterIdee(ideeId, compteId, oui, maintenant) {
      const deja = t.votes.some((v) => v.ideeId === ideeId && v.compteId === compteId);
      if (oui && !deja) t.votes.push({ ideeId, compteId, creeLe: maintenant });
      if (!oui) t.votes = t.votes.filter((v) => !(v.ideeId === ideeId && v.compteId === compteId));
    },
    async listerVotantsRecents(ideeId, nombre) {
      return t.votes.filter((v) => v.ideeId === ideeId).sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || a.compteId - b.compteId).slice(0, nombre).map((v) => v.compteId);
    },
    async listerCommentaires(ideeId, moi, nombre) {
      return [...t.commentaires.values()].filter((c) => c.ideeId === ideeId).sort((a, b) => a.creeLe.getTime() - b.creeLe.getTime() || a.id - b.id)
        .slice(0, nombre).map((c) => versCommentaire(c, moi));
    },
    async lireCommentaire(id, moi) {
      const c = t.commentaires.get(id);
      return c ? versCommentaire(c, moi) : null;
    },
    async creerCommentaire(ideeId, auteurId, texte, reponseAId, maintenant) {
      t.derniersIds.commentaires += 1;
      const id = t.derniersIds.commentaires;
      t.commentaires.set(id, { id, ideeId, auteurId, texte, reponseAId, masqueLe: null, suspenduLe: null, retireLe: null, creeLe: maintenant });
      return id;
    },
    async effacerCommentaire(id) {
      t.commentaires.delete(id);
      t.jaimes = t.jaimes.filter((j) => j.commentaireId !== id);
      for (const c of t.commentaires.values()) if (c.reponseAId === id) c.reponseAId = null;
    },
    async aimerCommentaire(commentaireId, compteId, oui, maintenant) {
      const deja = t.jaimes.some((j) => j.commentaireId === commentaireId && j.compteId === compteId);
      if (oui && !deja) t.jaimes.push({ commentaireId, compteId, creeLe: maintenant });
      if (!oui) t.jaimes = t.jaimes.filter((j) => !(j.commentaireId === commentaireId && j.compteId === compteId));
    },
    async lireActiviteRecente(villeCle, depuis, nombre) {
      const publiees = [...t.idees.values()].filter(estPubliee);
      const parVotant = new Map<number, { compteId: number; nombre: number; dernier: Date }>();
      for (const v of t.votes) {
        const idee = t.idees.get(v.ideeId);
        if (v.creeLe < depuis || !idee || !estPubliee(idee)) continue;
        const bilan = parVotant.get(v.compteId) ?? { compteId: v.compteId, nombre: 0, dernier: v.creeLe };
        bilan.nombre += 1;
        if (v.creeLe > bilan.dernier) bilan.dernier = v.creeLe;
        parVotant.set(v.compteId, bilan);
      }
      const dansLaVille = [...t.sorties.values()].filter((s) => villeCle !== null && s.villeCle === villeCle && s.annuleeLe === null && s.retireeLe === null);
      const arrivees = t.participations.filter((p) => p.statut === "accepte" && p.decideLe !== null && p.decideLe >= depuis && dansLaVille.some((s) => s.id === p.sortieId));
      const sorties = dansLaVille.filter((s) => s.creeLe >= depuis || arrivees.some((a) => a.sortieId === s.id));
      return {
        idees: publiees.filter((i) => i.publieeLe !== null && i.publieeLe >= depuis).map((i) => ({ id: i.id, auteurId: i.auteurId, titre: i.titre, publieeLe: i.publieeLe! })).slice(0, nombre),
        reponses: publiees.filter((i) => i.reponduLe !== null && i.reponduLe >= depuis).map((i) => ({ id: i.id, titre: i.titre, reponduLe: i.reponduLe! })).slice(0, nombre),
        votes: [...parVotant.values()].sort((a, b) => b.dernier.getTime() - a.dernier.getTime()).slice(0, nombre),
        sorties: sorties.map((s) => ({ ...s, etiquettes: s.etiquettes.filter((e) => e.retireeLe === null).map(({ nom, officielle }) => ({ nom, officielle })) })),
        arrivees: arrivees.map((a) => ({ sortieId: a.sortieId, compteId: a.compteId, decideLe: a.decideLe! })).slice(0, nombre),
      };
    },
  };
}
