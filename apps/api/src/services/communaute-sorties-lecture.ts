import { MAX_SORTIES_MIAMIS_LISTEES } from "../../../../packages/commun/src/regles/communaute.ts";
import { PRESENCE_OUVERTE_MINUTES_APRES } from "../../../../packages/commun/src/regles/sorties-miamis.ts";
import type { SortieMiamisApi } from "../../../../packages/commun/src/types/communaute.ts";
import { calculerSortiesTenues } from "../fonctions/communaute/calculer-sorties-tenues.ts";
import { estSortieVisible } from "../fonctions/communaute/est-sortie-visible.ts";
import { listerExclusSortie } from "../fonctions/communaute/lister-exclus-sortie.ts";
import { normaliserVilleCle } from "../fonctions/communaute/normaliser-ville-cle.ts";
import { presenterSortieMiamis } from "../fonctions/communaute/presenter-sortie-miamis.ts";
import type { ContexteCommunaute, LigneParticipationMiamis, LigneSortieMiamis, TablesCommunaute } from "./communaute-regles.ts";
import { lireNouveaux, lireProfilsVisibilite } from "./communaute-profils.ts";

const AUCUNE_TENUE = { tenues: 0, prevues: 0 };

export type SortieLue = { ligne: LigneSortieMiamis; participations: LigneParticipationMiamis[] };

export function grouperParticipations(participations: readonly LigneParticipationMiamis[]): Map<number, LigneParticipationMiamis[]> {
  const parSortie = new Map<number, LigneParticipationMiamis[]>();
  for (const p of participations) parSortie.set(p.sortieId, [...(parSortie.get(p.sortieId) ?? []), p]);
  return parSortie;
}

export async function retirerExclus(t: TablesCommunaute, lues: readonly SortieLue[]): Promise<SortieLue[]> {
  const ids = [...new Set(lues.flatMap((l) => [l.ligne.organisateurId, ...l.participations.map((p) => p.compteId)]))];
  const paires = ids.length > 1 ? await t.listerPairesBloquees(ids) : [];
  if (paires.length === 0) return [...lues];
  return lues.map((l) => {
    const exclus = listerExclusSortie(l.ligne.organisateurId, l.participations.map((p) => p.compteId), paires);
    return { ligne: l.ligne, participations: l.participations.filter((p) => !exclus.has(p.compteId)) };
  });
}

export function creerLectureSortiesMiamis(c: ContexteCommunaute) {
  async function lireAvecParticipations(t: TablesCommunaute, lignes: readonly LigneSortieMiamis[]): Promise<SortieLue[]> {
    const parSortie = grouperParticipations(await t.lireParticipations(lignes.map((l) => l.id)));
    return retirerExclus(t, lignes.map((ligne) => ({ ligne, participations: parSortie.get(ligne.id) ?? [] })));
  }

  async function presenter(t: TablesCommunaute, moi: number, lues: readonly SortieLue[], maintenant: Date): Promise<SortieMiamisApi[]> {
    if (lues.length === 0) return [];
    const organisateurs = [...new Set(lues.map((l) => l.ligne.organisateurId))];
    const comptesIds = [...new Set([...organisateurs, ...lues.flatMap((l) => l.participations.map((p) => p.compteId))])];
    const demandeurs = [...new Set(lues.filter((l) => l.ligne.organisateurId === moi).flatMap((l) => l.participations.filter((p) => p.statut === "demande").map((p) => p.compteId)))];
    const [personnes, comptes, potes, blocages, lieux, rescousses, historiques] = await Promise.all([
      c.relations.presenter(comptesIds),
      t.lireComptes(comptesIds),
      c.relations.listerPotes(moi),
      c.relations.listerBlocages(moi),
      t.lireLieux([...new Set(lues.map((l) => l.ligne.lieuId))]),
      t.compterRescousses(organisateurs),
      t.lireHistoriques([...new Set([...organisateurs, ...demandeurs])], maintenant),
    ]);
    const tenues = calculerSortiesTenues(historiques, maintenant);
    const nouveaux = lireNouveaux(comptes, maintenant);
    const sorties: SortieMiamisApi[] = [];
    for (const l of lues) {
      const lieu = lieux.get(l.ligne.lieuId);
      if (!lieu) continue;
      const organisateur = comptes.get(l.ligne.organisateurId);
      const sortie = presenterSortieMiamis({
        moi, ligne: l.ligne, participations: l.participations, lieu, personnes, potes: new Set(potes), caches: blocages.caches, nouveaux,
        tenuesOrganisateur: tenues.get(l.ligne.organisateurId) ?? AUCUNE_TENUE,
        rescoussesOrganisateur: organisateur?.activitePartagee ? (rescousses.get(l.ligne.organisateurId) ?? 0) : 0,
        tenuesDemandeurs: tenues, maintenant,
      });
      if (sortie) sorties.push(sortie);
    }
    return sorties;
  }

  async function filtrerVisibles(t: TablesCommunaute, moi: number, lues: readonly SortieLue[], maintenant: Date): Promise<SortieLue[]> {
    if (lues.length === 0) return [];
    const [profils, blocages, lieux] = await Promise.all([
      lireProfilsVisibilite(c, t, [moi], maintenant),
      c.relations.listerBlocages(moi),
      t.lireLieux([...new Set(lues.map((l) => l.ligne.lieuId))]),
    ]);
    return lues.filter((l) => estSortieVisible({
      moi, ligne: l.ligne, participations: l.participations, profil: profils.get(moi) ?? null, caches: blocages.caches, lieuPublie: lieux.get(l.ligne.lieuId)?.publie ?? false,
    }));
  }

  return {
    lireAvecParticipations,
    presenter,
    filtrerVisibles,

    async lister(moi: number, maintenant: Date): Promise<SortieMiamisApi[]> {
      return c.depot.lire(async (t) => {
        const villeCle = normaliserVilleCle((await t.lireComptes([moi])).get(moi)?.ville);
        const depuis = new Date(maintenant.getTime() - PRESENCE_OUVERTE_MINUTES_APRES * 60_000);
        const [miennes, deLaVille] = await Promise.all([
          t.listerSortiesDe(moi, depuis, MAX_SORTIES_MIAMIS_LISTEES),
          villeCle ? t.listerSortiesVille(villeCle, maintenant, MAX_SORTIES_MIAMIS_LISTEES) : Promise.resolve([]),
        ]);
        const lignes = [...new Map([...miennes, ...deLaVille].map((l) => [l.id, l])).values()]
          .sort((a, b) => a.quand.getTime() - b.quand.getTime() || a.id - b.id)
          .slice(0, MAX_SORTIES_MIAMIS_LISTEES);
        const visibles = await filtrerVisibles(t, moi, await lireAvecParticipations(t, lignes), maintenant);
        return presenter(t, moi, visibles, maintenant);
      });
    },

    async lire(moi: number, id: number, maintenant: Date): Promise<SortieMiamisApi | null> {
      return c.depot.lire(async (t) => {
        const visibles = await filtrerVisibles(t, moi, await lireAvecParticipations(t, await t.lireSorties([id])), maintenant);
        return (await presenter(t, moi, visibles, maintenant))[0] ?? null;
      });
    },

    async rendre(moi: number, id: number, maintenant: Date): Promise<SortieMiamisApi | null> {
      return c.depot.lire(async (t) => {
        const lues = (await lireAvecParticipations(t, await t.lireSorties([id]))).filter((l) => l.ligne.annuleeLe === null && l.ligne.retireeLe === null);
        return (await presenter(t, moi, lues, maintenant))[0] ?? null;
      });
    },
  };
}

export type LectureSortiesMiamis = ReturnType<typeof creerLectureSortiesMiamis>;
