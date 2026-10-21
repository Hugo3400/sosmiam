import { HEURES_CONSERVATION_COUCOU, MAX_PRESENTS_LISTES, MAX_SORTIES_MIAMIS_LISTEES, MINUTES_PRESENCE_QUI_EST_LA } from "../../../../packages/commun/src/regles/communaute.ts";
import type { QuiEstLaApi } from "../../../../packages/commun/src/types/communaute.ts";
import type { CoucouMiami, MiamiPresent } from "../../../../packages/commun/src/types/qui-est-la.ts";
import { normaliserVilleCle } from "../fonctions/communaute/normaliser-ville-cle.ts";
import { annoncer } from "./communaute-effets.ts";
import { refus, type ContexteCommunaute, type ServicesQuiEstLa, type TablesCommunaute } from "./communaute-regles.ts";
import type { LectureSortiesMiamis } from "./communaute-sorties-lecture.ts";

const PRESENTS_LUS = 500;

const lireCoucou = (envoye: boolean, recu: boolean): CoucouMiami => (envoye && recu ? "reciproque" : envoye ? "envoye" : recu ? "recu" : "aucun");

export function creerQuiEstLa(c: ContexteCommunaute, lecture: LectureSortiesMiamis): ServicesQuiEstLa {
  const depuisCoucous = (maintenant: Date) => new Date(maintenant.getTime() - HEURES_CONSERVATION_COUCOU * 3_600_000);

  async function lireMaPresence(t: TablesCommunaute, moi: number, maintenant: Date) {
    const [profil, presence] = await Promise.all([t.lireProfil(moi), t.lirePresence(moi)]);
    const enCours = presence && presence.jusqua > maintenant && profil?.quiEstLa ? presence : null;
    return { visible: profil?.quiEstLa ?? false, presence: enCours };
  }

  async function lesOrganisateurs(t: TablesCommunaute, moi: number, villeCle: string, maintenant: Date) {
    const lignes = await t.listerSortiesVille(villeCle, maintenant, MAX_SORTIES_MIAMIS_LISTEES);
    const visibles = await lecture.filtrerVisibles(t, moi, await lecture.lireAvecParticipations(t, lignes), maintenant);
    const parOrganisateur = new Map<number, { sortieId: string; titre: string }>();
    for (const { ligne } of visibles) if (!parOrganisateur.has(ligne.organisateurId)) parOrganisateur.set(ligne.organisateurId, { sortieId: String(ligne.id), titre: ligne.titre });
    return parOrganisateur;
  }

  return {
    async lire(moi, maintenant) {
      return c.depot.lire(async (t): Promise<QuiEstLaApi> => {
        const compte = (await t.lireComptes([moi])).get(moi);
        const villeCle = normaliserVilleCle(compte?.ville);
        const { visible, presence } = await lireMaPresence(t, moi, maintenant);
        const vide = { ville: compte?.ville ?? null, visible, jusqua: presence?.jusqua.toISOString() ?? null, total: 0, presents: [] };
        if (!villeCle) return vide;
        const [ids, blocages] = await Promise.all([t.listerPresents(villeCle, maintenant, PRESENTS_LUS), c.relations.listerBlocages(moi)]);
        const candidats = ids.filter((id) => id !== moi && !blocages.caches.has(id));
        const [personnes, liens, coucous, organisent] = await Promise.all([
          c.relations.presenter(candidats),
          c.relations.lireLiens(moi, candidats),
          t.lireCoucous(moi, depuisCoucous(maintenant)),
          lesOrganisateurs(t, moi, villeCle, maintenant),
        ]);
        const presents: MiamiPresent[] = candidats.flatMap((id) => {
          const personne = personnes.get(id);
          if (!personne) return [];
          const dansTaBande = liens.get(id)?.pote ?? false;
          return [{
            personne: dansTaBande ? personne : { ...personne, prenom: "" }, dansTaBande, ambassadeur: false, nouveauDansLaVille: false, rescousses: 0, titreBadge: null,
            organise: organisent.get(id) ?? null, enviesEnCommun: [], coucou: lireCoucou(coucous.envoyes.has(id), coucous.recus.has(id)),
          }];
        });
        return { ...vide, total: presents.length, presents: presents.slice(0, MAX_PRESENTS_LISTES) };
      });
    },

    async montrer(moi, maintenant) {
      return c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const villeCle = normaliserVilleCle((await t.lireComptes([moi])).get(moi)?.ville);
        if (!villeCle) return refus("ville-requise");
        const jusqua = new Date(maintenant.getTime() + MINUTES_PRESENCE_QUI_EST_LA * 60_000);
        await t.ecrireProfil(moi, { quiEstLa: true }, maintenant);
        await t.ecrirePresence(moi, villeCle, jusqua);
        return { ok: true as const, visible: true, jusqua: jusqua.toISOString(), effets: [] };
      });
    },

    async cacher(moi, maintenant) {
      return c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        await t.ecrireProfil(moi, { quiEstLa: false }, maintenant);
        await t.effacerPresence(moi);
        await t.effacerCoucous(moi);
        return { ok: true as const, visible: false, jusqua: null, effets: [] };
      });
    },

    async faireCoucou(moi, personne, maintenant) {
      if (personne === null || personne === moi) return refus("personne-inconnue");
      const issue = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi, personne]);
        const [miens, siens, sa] = await Promise.all([lireMaPresence(t, moi, maintenant), lireMaPresence(t, personne, maintenant), t.lirePresence(personne)]);
        if (!miens.presence) return refus("invisible-ici");
        if (!siens.presence || sa?.villeCle !== miens.presence.villeCle || (await t.bloqueEntre(moi, personne))) return refus("personne-inconnue");
        const avant = await t.lireCoucous(moi, depuisCoucous(maintenant));
        await t.ecrireCoucou(moi, personne, maintenant);
        return { recu: avant.recus.has(personne), nouveau: !avant.envoyes.has(personne) };
      });
      if ("ok" in issue) return issue;
      const effets = issue.recu && issue.nouveau
        ? await annoncer(c.relations, { type: "coucou-reciproque", acteurId: moi, cible: null, detail: "", destinataires: [personne], push: (prenom) => ({ quoi: "coucou", prenom }) })
        : [];
      return { ok: true, coucou: issue.recu ? "reciproque" : "envoye", effets };
    },
  };
}
