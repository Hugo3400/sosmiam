import type { DomaineOffreCarriere, StatutCandidature, TypeOffreCarriere } from "../../../../packages/commun/src/types/carriere.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { CandidatureCarriere, OffreCarriere } from "../base-de-donnees/client-genere/client.ts";
import { lireListeTextes } from "../fonctions/carriere/lire-liste-textes.ts";
import type { CandidatureEnBase, CompteCandidatures, DepotCarriere, OffreEnBase } from "./carriere-regles.ts";

type BaseCarriere = Pick<typeof baseDeDonnees, "$transaction" | "$queryRaw" | "offreCarriere" | "candidatureCarriere">;

const versOffre = (ligne: OffreCarriere): OffreEnBase => ({
  id: ligne.id,
  titre: ligne.titre,
  type: ligne.type as TypeOffreCarriere,
  domaine: ligne.domaine as DomaineOffreCarriere,
  resume: ligne.resume,
  description: ligne.description,
  missions: lireListeTextes(ligne.missions),
  profil: lireListeTextes(ligne.profil),
  enEchange: lireListeTextes(ligne.enEchange),
  lieu: ligne.lieu,
  publieeLe: ligne.publieeLe,
  fermeeLe: ligne.fermeeLe,
  creeLe: ligne.creeLe,
  modifieLe: ligne.modifieLe,
});

const versCandidature = (ligne: CandidatureCarriere): CandidatureEnBase => ({ ...ligne, statut: ligne.statut as StatutCandidature });

const estAbsente = (erreur: unknown) => (erreur as { code?: unknown } | null)?.code === "P2025";

const ESPACE_VERROU_CANDIDATURES = 0x43_56_00_01;

const lireCleVerrouEmail = (empreinte: string) => Number.parseInt(empreinte.slice(0, 8).padEnd(8, "0"), 16) | 0;

const lireDepotsEmail = async (b: Pick<BaseCarriere, "candidatureCarriere">, empreinte: string, depuis: Date) => (await b.candidatureCarriere.findMany({
  where: { emailEmpreinte: empreinte, creeLe: { gt: depuis } },
  select: { creeLe: true },
  take: 50,
})).map((l) => l.creeLe);

export function creerDepotCarriere(base: BaseCarriere = baseDeDonnees): DepotCarriere {
  const lireOffre = async (id: number) => {
    const ligne = await base.offreCarriere.findUnique({ where: { id } });
    return ligne ? versOffre(ligne) : null;
  };

  return {
    listerOffresOuvertes: async (maintenant) => (await base.offreCarriere.findMany({
      where: { publieeLe: { not: null, lte: maintenant }, OR: [{ fermeeLe: null }, { fermeeLe: { gt: maintenant } }] },
      orderBy: [{ publieeLe: "desc" }, { id: "desc" }],
      take: 100,
    })).map(versOffre),

    listerOffres: async () => (await base.offreCarriere.findMany({ orderBy: [{ creeLe: "desc" }, { id: "desc" }], take: 500 })).map(versOffre),

    lireOffre,

    compterCandidatures: async (offreIds) => {
      const comptes = new Map<number, CompteCandidatures>();
      if (offreIds.length === 0) return comptes;
      const groupes = await base.candidatureCarriere.groupBy({ by: ["offreId", "statut"], where: { offreId: { in: [...offreIds] } }, _count: { _all: true } });
      for (const groupe of groupes) {
        const compte = comptes.get(groupe.offreId) ?? { candidatures: 0, nouvelles: 0 };
        compte.candidatures += groupe._count._all;
        if (groupe.statut === "nouvelle") compte.nouvelles += groupe._count._all;
        comptes.set(groupe.offreId, compte);
      }
      return comptes;
    },

    creerOffre: async (donnees, maintenant) => versOffre(await base.offreCarriere.create({ data: { ...donnees, creeLe: maintenant, modifieLe: maintenant } })),

    modifierOffre: async (id, changements, maintenant) => {
      const { count } = await base.offreCarriere.updateMany({ where: { id }, data: { ...changements, modifieLe: maintenant } });
      return count === 0 ? null : lireOffre(id);
    },

    supprimerOffre: (id) => base.$transaction(async (tx) => {
      const lignes = await tx.candidatureCarriere.findMany({ where: { offreId: id, cvFichier: { not: null } }, select: { cvFichier: true } });
      const { count } = await tx.offreCarriere.deleteMany({ where: { id } });
      return count === 0 ? null : { cvFichiers: lignes.flatMap((l) => (l.cvFichier ? [l.cvFichier] : [])) };
    }),

    listerDepotsEmail: (empreinte, depuis) => lireDepotsEmail(base, empreinte, depuis),

    ajouterCandidature: (candidature, { depuis, maximum }) => base.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ESPACE_VERROU_CANDIDATURES}::int4, ${lireCleVerrouEmail(candidature.emailEmpreinte)}::int4)`;
      const depots = await lireDepotsEmail(tx, candidature.emailEmpreinte, depuis);
      if (depots.length >= maximum) return { ok: false as const, depots };
      await tx.candidatureCarriere.create({ data: candidature });
      return { ok: true as const };
    }),

    listerCandidatures: async ({ offreId, statut }, nombre) => (await base.candidatureCarriere.findMany({
      where: { offreId, statut },
      orderBy: [{ creeLe: "desc" }, { id: "desc" }],
      take: nombre,
      include: { offre: { select: { titre: true } } },
    })).map(({ offre, ...ligne }) => ({ ...versCandidature(ligne), offreTitre: offre.titre })),

    listerCandidaturesApres: async (apres, nombre) => (await base.candidatureCarriere.findMany({
      where: apres === null ? {} : { id: { gt: apres } },
      orderBy: { id: "asc" },
      take: nombre,
    })).map(versCandidature),

    lireCandidature: async (id) => {
      const ligne = await base.candidatureCarriere.findUnique({ where: { id } });
      return ligne ? versCandidature(ligne) : null;
    },

    changerStatut: async (id, statut, lueLe) => (await base.candidatureCarriere.updateMany({ where: { id }, data: { statut, lueLe } })).count > 0,

    remplacerChiffres: async (id, cvAvant, chiffres) => (await base.candidatureCarriere.updateMany({ where: { id, cvFichier: cvAvant }, data: chiffres })).count > 0,

    supprimerCandidature: async (id) => {
      try {
        return await base.candidatureCarriere.delete({ where: { id }, select: { cvFichier: true } });
      } catch (erreur) {
        if (estAbsente(erreur)) return null;
        throw erreur;
      }
    },

    effacerCandidaturesAvant: async (limite) => {
      const lignes = await base.$queryRaw<{ cv_fichier: string | null }[]>`DELETE FROM candidatures_carriere WHERE cree_le < ${limite} RETURNING cv_fichier`;
      return { nombre: lignes.length, cvFichiers: lignes.flatMap((l) => (l.cv_fichier ? [l.cv_fichier] : [])) };
    },

    listerCvCites: async (fichiers) => {
      if (fichiers.length === 0) return new Set();
      const lignes = await base.candidatureCarriere.findMany({ where: { cvFichier: { in: [...fichiers] } }, select: { cvFichier: true } });
      return new Set(lignes.flatMap((l) => (l.cvFichier ? [l.cvFichier] : [])));
    },
  };
}
