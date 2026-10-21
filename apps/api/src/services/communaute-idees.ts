import { MAX_COMMENTAIRES_IDEE_LISTES, MAX_IDEES_LISTEES, VOTANTS_NOMMES_IDEE } from "../../../../packages/commun/src/regles/communaute.ts";
import type { IdeeMiamis } from "../../../../packages/commun/src/types/idees.ts";
import { lireCleTitreIdee } from "../fonctions/communaute/lire-cle-titre-idee.ts";
import { presenterCommentaireIdee } from "../fonctions/communaute/presenter-commentaire-idee.ts";
import { presenterIdeeMiamis } from "../fonctions/communaute/presenter-idee-miamis.ts";
import { trierCommentairesIdee } from "../fonctions/communaute/trier-commentaires-idee.ts";
import { refus, type ContexteCommunaute, type LigneCommentaireIdee, type LigneIdee, type ServicesIdees, type TablesCommunaute } from "./communaute-regles.ts";

class CleDejaNotee extends Error {}

const VOTANTS_LUS = 30;

export function creerIdees(c: ContexteCommunaute): ServicesIdees {
  const estVisible = (l: LigneIdee, moi: number, caches: ReadonlySet<number>) =>
    l.retireeLe === null && ((l.statut !== "en-relecture" && l.suspendueLe === null) || l.auteurId === moi) && !(l.auteurId !== null && caches.has(l.auteurId));
  const estCommentaireVisible = (l: LigneCommentaireIdee, moi: number) => l.retireLe === null && ((l.masqueLe === null && l.suspenduLe === null) || l.auteurId === moi);

  async function lireVisible(t: TablesCommunaute, moi: number, id: number) {
    const [ligne, blocages] = await Promise.all([t.lireIdee(id, moi), c.relations.listerBlocages(moi)]);
    return ligne && estVisible(ligne, moi, blocages.caches) ? { ligne, caches: blocages.caches } : null;
  }

  async function presenter(t: TablesCommunaute, moi: number, ligne: LigneIdee, avecVotants: boolean): Promise<IdeeMiamis> {
    const votants = avecVotants ? await lireVotants(t, moi, ligne.id) : [];
    const personnes = await c.relations.presenter(ligne.auteurId !== null ? [ligne.auteurId] : []);
    return presenterIdeeMiamis(ligne, personnes, votants);
  }

  async function lireVotants(t: TablesCommunaute, moi: number, ideeId: number) {
    const [ids, potes, blocages] = await Promise.all([t.listerVotantsRecents(ideeId, VOTANTS_LUS), c.relations.listerPotes(moi), c.relations.listerBlocages(moi)]);
    const mesPotes = new Set(potes);
    const gardes = ids.filter((id) => id !== moi && !blocages.caches.has(id));
    const ordonnes = [...gardes.filter((id) => mesPotes.has(id)), ...gardes.filter((id) => !mesPotes.has(id))];
    const personnes = await c.relations.presenter(ordonnes);
    return ordonnes.flatMap((id) => personnes.get(id) ?? []).slice(0, VOTANTS_NOMMES_IDEE);
  }

  async function lireCommentaireVisible(t: TablesCommunaute, moi: number, commentaireId: number) {
    const commentaire = await t.lireCommentaire(commentaireId, moi);
    if (!commentaire) return null;
    const idee = await lireVisible(t, moi, commentaire.ideeId);
    if (!idee || idee.ligne.statut === "en-relecture" || idee.caches.has(commentaire.auteurId)) return null;
    if (!estCommentaireVisible(commentaire, moi)) return null;
    return commentaire;
  }

  async function presenterCommentaire(moi: number, commentaire: LigneCommentaireIdee) {
    const auteur = (await c.relations.presenter([commentaire.auteurId])).get(commentaire.auteurId);
    return auteur ? presenterCommentaireIdee(commentaire, auteur) : null;
  }

  async function creerDansLaBase(moi: number, idee: { titre: string; detail: string }, cle: string, maintenant: Date) {
    return c.depot.ecrire(async (t) => {
      await t.verrouillerComptes([moi]);
      const deja = await t.lireIdempotence(moi, cle, "idee");
      if (deja !== null) return { id: deja, cree: false };
      const titreCle = lireCleTitreIdee(idee.titre);
      if ((await t.trouverIdeeParCle(titreCle)) !== null) return refus("idee-proche");
      const id = await t.creerIdee(moi, idee, titreCle, maintenant);
      if (!(await t.noterIdempotence(moi, cle, "idee", id, maintenant))) throw new CleDejaNotee();
      return { id, cree: true };
    });
  }

  return {
    async lister(moi) {
      return c.depot.lire(async (t) => {
        const [lignes, blocages] = await Promise.all([t.listerIdees(moi, MAX_IDEES_LISTEES), c.relations.listerBlocages(moi)]);
        const visibles = lignes.filter((l) => estVisible(l, moi, blocages.caches)).sort((a, b) => b.votes - a.votes || b.creeLe.getTime() - a.creeLe.getTime());
        const personnes = await c.relations.presenter([...new Set(visibles.flatMap((l) => (l.auteurId !== null ? [l.auteurId] : [])))]);
        return visibles.map((l) => presenterIdeeMiamis(l, personnes));
      });
    },

    async lire(moi, id) {
      return c.depot.lire(async (t) => {
        const lue = await lireVisible(t, moi, id);
        if (!lue) return null;
        const lignes = (await t.listerCommentaires(id, moi, MAX_COMMENTAIRES_IDEE_LISTES))
          .filter((l) => !lue.caches.has(l.auteurId) && estCommentaireVisible(l, moi));
        const personnes = await c.relations.presenter([...new Set(lignes.map((l) => l.auteurId))]);
        const tries = trierCommentairesIdee(lignes.filter((l) => personnes.has(l.auteurId)));
        const visibles = new Set(tries.map((l) => l.id));
        const commentaires = tries.map((l) => presenterCommentaireIdee(l, personnes.get(l.auteurId)!, l.reponseAId !== null && visibles.has(l.reponseAId)));
        return { idee: await presenter(t, moi, lue.ligne, true), commentaires };
      });
    },

    async proposer(moi, idee, cle, maintenant) {
      let issue: Awaited<ReturnType<typeof creerDansLaBase>>;
      try {
        issue = await creerDansLaBase(moi, idee, cle, maintenant);
      } catch (erreur) {
        if (!(erreur instanceof CleDejaNotee)) throw erreur;
        const relue = await c.depot.lire((t) => t.lireIdempotence(moi, cle, "idee"));
        if (relue === null) return refus("cle-deja-prise");
        issue = { id: relue, cree: false };
      }
      if ("ok" in issue) return issue;
      const { id, cree } = issue;
      const ligne = await c.depot.lire((t) => t.lireIdee(id, moi));
      if (!ligne) return refus("idee-inconnue");
      return { ok: true, idee: await c.depot.lire((t) => presenter(t, moi, ligne, false)), cree, effets: [] };
    },

    async retirer(moi, id) {
      return c.depot.lire(async (t) => {
        const lue = await lireVisible(t, moi, id);
        if (!lue) return refus("idee-inconnue");
        if (lue.ligne.auteurId !== moi) return refus("reserve-a-l-auteur");
        await t.effacerIdee(id);
        return { ok: true as const, effets: [] };
      });
    },

    async voter(moi, id, oui, maintenant) {
      return c.depot.lire(async (t) => {
        const lue = await lireVisible(t, moi, id);
        if (!lue) return refus("idee-inconnue");
        if (lue.ligne.statut === "en-relecture") return refus("idee-en-relecture");
        await t.voterIdee(id, moi, oui, maintenant);
        const ligne = await t.lireIdee(id, moi);
        return ligne ? { ok: true as const, idee: await presenter(t, moi, ligne, true), effets: [] } : refus("idee-inconnue");
      });
    },

    async commenter(moi, id, texte, reponseA, maintenant) {
      return c.depot.lire(async (t) => {
        const lue = await lireVisible(t, moi, id);
        if (!lue) return refus("idee-inconnue");
        if (lue.ligne.statut === "en-relecture") return refus("idee-en-relecture");
        let parent: number | null = null;
        if (reponseA !== null) {
          const cible = await lireCommentaireVisible(t, moi, reponseA);
          if (!cible || cible.ideeId !== id) return refus("commentaire-inconnu");
          parent = cible.reponseAId ?? cible.id;
        }
        const nouveau = await t.lireCommentaire(await t.creerCommentaire(id, moi, texte, parent, maintenant), moi);
        const commentaire = nouveau ? await presenterCommentaire(moi, nouveau) : null;
        return commentaire ? { ok: true as const, commentaire, effets: [] } : refus("commentaire-inconnu");
      });
    },

    async supprimerCommentaire(moi, commentaireId) {
      return c.depot.lire(async (t) => {
        const commentaire = await lireCommentaireVisible(t, moi, commentaireId);
        if (!commentaire) return refus("commentaire-inconnu");
        if (commentaire.auteurId !== moi) return refus("reserve-a-l-auteur");
        await t.effacerCommentaire(commentaireId);
        return { ok: true as const, effets: [] };
      });
    },

    async aimerCommentaire(moi, commentaireId, oui, maintenant) {
      return c.depot.lire(async (t) => {
        if (!(await lireCommentaireVisible(t, moi, commentaireId))) return refus("commentaire-inconnu");
        await t.aimerCommentaire(commentaireId, moi, oui, maintenant);
        const relu = await t.lireCommentaire(commentaireId, moi);
        const commentaire = relu ? await presenterCommentaire(moi, relu) : null;
        return commentaire ? { ok: true as const, commentaire, effets: [] } : refus("commentaire-inconnu");
      });
    },
  };
}
