import { estOffreOuverte } from "../fonctions/carriere/est-offre-ouverte.ts";
import type { CandidatureEnBase, CompteCandidatures, DepotCarriere, OffreEnBase } from "./carriere-regles.ts";

export type DepotCarriereEnMemoire = DepotCarriere & {
  offres: Map<number, OffreEnBase>;
  candidatures: Map<string, CandidatureEnBase>;
};

const copierOffre = (offre: OffreEnBase): OffreEnBase => ({ ...offre, missions: [...offre.missions], profil: [...offre.profil], enEchange: [...offre.enEchange] });
const parDateDecroissante = (a: Date | null, b: Date | null) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0);

export function creerDepotCarriereEnMemoire(): DepotCarriereEnMemoire {
  const offres = new Map<number, OffreEnBase>();
  const candidatures = new Map<string, CandidatureEnBase>();
  let prochainId = 1;

  const lireOffre = async (id: number) => {
    const offre = offres.get(id);
    return offre ? copierOffre(offre) : null;
  };
  const retirer = (filtre: (c: CandidatureEnBase) => boolean) => {
    const retirees = [...candidatures.values()].filter(filtre);
    for (const c of retirees) candidatures.delete(c.id);
    return retirees;
  };
  const fichiersDe = (liste: CandidatureEnBase[]) => liste.flatMap((c) => (c.cvFichier ? [c.cvFichier] : []));

  return {
    offres,
    candidatures,

    listerOffresOuvertes: async (maintenant) => [...offres.values()]
      .filter((o) => estOffreOuverte(o, maintenant))
      .sort((a, b) => parDateDecroissante(a.publieeLe, b.publieeLe) || b.id - a.id)
      .map(copierOffre),

    listerOffres: async () => [...offres.values()].sort((a, b) => parDateDecroissante(a.creeLe, b.creeLe) || b.id - a.id).map(copierOffre),

    lireOffre,

    compterCandidatures: async (offreIds) => {
      const comptes = new Map<number, CompteCandidatures>();
      for (const c of candidatures.values()) {
        if (!offreIds.includes(c.offreId)) continue;
        const compte = comptes.get(c.offreId) ?? { candidatures: 0, nouvelles: 0 };
        compte.candidatures++;
        if (c.statut === "nouvelle") compte.nouvelles++;
        comptes.set(c.offreId, compte);
      }
      return comptes;
    },

    creerOffre: async (donnees, maintenant) => {
      const offre: OffreEnBase = { ...donnees, id: prochainId++, publieeLe: null, fermeeLe: null, creeLe: maintenant, modifieLe: maintenant };
      offres.set(offre.id, offre);
      return copierOffre(offre);
    },

    modifierOffre: async (id, changements, maintenant) => {
      const offre = offres.get(id);
      if (!offre) return null;
      offres.set(id, { ...offre, ...changements, modifieLe: maintenant });
      return lireOffre(id);
    },

    supprimerOffre: async (id) => {
      if (!offres.delete(id)) return null;
      return { cvFichiers: fichiersDe(retirer((c) => c.offreId === id)) };
    },

    listerDepotsEmail: async (empreinte, depuis) => [...candidatures.values()]
      .filter((c) => c.emailEmpreinte === empreinte && c.creeLe.getTime() > depuis.getTime())
      .map((c) => c.creeLe),

    ajouterCandidature: async (candidature) => {
      if (!offres.has(candidature.offreId)) throw new Error("Clé étrangère : offre absente");
      if (candidatures.has(candidature.id)) throw new Error("Clé primaire déjà prise");
      if (candidature.cvFichier && [...candidatures.values()].some((c) => c.cvFichier === candidature.cvFichier)) throw new Error("CV déjà cité");
      candidatures.set(candidature.id, { ...candidature });
    },

    listerCandidatures: async ({ offreId, statut }, nombre) => [...candidatures.values()]
      .filter((c) => (offreId === undefined || c.offreId === offreId) && (statut === undefined || c.statut === statut))
      .sort((a, b) => parDateDecroissante(a.creeLe, b.creeLe) || (a.id < b.id ? 1 : -1))
      .slice(0, nombre)
      .map((c) => ({ ...c, offreTitre: offres.get(c.offreId)?.titre ?? "" })),

    listerCandidaturesApres: async (apres, nombre) => [...candidatures.values()]
      .filter((c) => apres === null || c.id > apres)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .slice(0, nombre)
      .map((c) => ({ ...c })),

    lireCandidature: async (id) => {
      const c = candidatures.get(id);
      return c ? { ...c } : null;
    },

    changerStatut: async (id, statut, lueLe) => {
      const c = candidatures.get(id);
      if (!c) return false;
      candidatures.set(id, { ...c, statut, lueLe });
      return true;
    },

    remplacerChiffres: async (id, cvAvant, chiffres) => {
      const c = candidatures.get(id);
      if (!c || c.cvFichier !== cvAvant) return false;
      candidatures.set(id, { ...c, ...chiffres });
      return true;
    },

    supprimerCandidature: async (id) => {
      const c = candidatures.get(id);
      if (!c) return null;
      candidatures.delete(id);
      return { cvFichier: c.cvFichier };
    },

    effacerCandidaturesAvant: async (limite) => {
      const retirees = retirer((c) => c.creeLe.getTime() < limite.getTime());
      return { nombre: retirees.length, cvFichiers: fichiersDe(retirees) };
    },

    listerCvCites: async (fichiers) => new Set(fichiersDe([...candidatures.values()]).filter((f) => fichiers.includes(f))),
  };
}
