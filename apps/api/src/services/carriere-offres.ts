import type { OffreCarriere, OffreCarriereGestion } from "../../../../packages/commun/src/types/carriere.ts";
import { estOffreOuverte } from "../fonctions/carriere/est-offre-ouverte.ts";
import { lireDonneesOffre } from "../fonctions/carriere/lire-donnees-offre.ts";
import { lireIdOffre } from "../fonctions/carriere/lire-id-offre.ts";
import { presenterOffreCarriere } from "../fonctions/carriere/presenter-offre-carriere.ts";
import { presenterOffreGestion } from "../fonctions/carriere/presenter-offre-gestion.ts";
import { LIEU_OFFRE_PAR_DEFAUT, type DependancesCarriere, type OffreEnBase, type ResultatOffreGestion } from "./carriere-regles.ts";

const estPubliee = (offre: OffreEnBase): offre is OffreEnBase & { publieeLe: Date } => offre.publieeLe !== null;

export function creerOffresCarriere({ depot, stockage, horloge = Date.now }: DependancesCarriere) {
  const maintenant = () => new Date(horloge());

  async function presenterPourGestion(offre: OffreEnBase): Promise<OffreCarriereGestion> {
    const comptes = await depot.compterCandidatures([offre.id]);
    return presenterOffreGestion(offre, comptes.get(offre.id));
  }

  return {
    async listerOffresPubliees(): Promise<OffreCarriere[]> {
      return (await depot.listerOffresOuvertes(maintenant())).filter(estPubliee).map(presenterOffreCarriere);
    },

    async lireOffrePubliee(id: string): Promise<OffreCarriere | null> {
      const offreId = lireIdOffre(id);
      const offre = offreId === null ? null : await depot.lireOffre(offreId);
      return offre && estPubliee(offre) && estOffreOuverte(offre, maintenant()) ? presenterOffreCarriere(offre) : null;
    },

    async listerOffresGestion(): Promise<OffreCarriereGestion[]> {
      const offres = await depot.listerOffres();
      const comptes = await depot.compterCandidatures(offres.map((o) => o.id));
      return offres.map((offre) => presenterOffreGestion(offre, comptes.get(offre.id)));
    },

    async creerOffre(donnees: unknown, quand = maintenant()): Promise<ResultatOffreGestion> {
      const lecture = lireDonneesOffre(donnees, LIEU_OFFRE_PAR_DEFAUT);
      if (!lecture.ok) return { ok: false, erreur: "champ-invalide", champ: lecture.champ };
      return { ok: true, offre: presenterOffreGestion(await depot.creerOffre(lecture.donnees, quand), undefined) };
    },

    async modifierOffre(id: string, donnees: unknown, quand = maintenant()): Promise<ResultatOffreGestion> {
      const offreId = lireIdOffre(id);
      if (offreId === null) return { ok: false, erreur: "offre-inconnue" };
      const lecture = lireDonneesOffre(donnees, LIEU_OFFRE_PAR_DEFAUT);
      if (!lecture.ok) return { ok: false, erreur: "champ-invalide", champ: lecture.champ };
      const offre = await depot.modifierOffre(offreId, lecture.donnees, quand);
      return offre ? { ok: true, offre: await presenterPourGestion(offre) } : { ok: false, erreur: "offre-inconnue" };
    },

    async publierOffre(id: string, quand = maintenant()): Promise<OffreCarriereGestion | null> {
      const offreId = lireIdOffre(id);
      const offre = offreId === null ? null : await depot.lireOffre(offreId);
      if (!offre) return null;
      if (estOffreOuverte(offre, quand)) return presenterPourGestion(offre);
      const publiee = await depot.modifierOffre(offre.id, { publieeLe: quand, fermeeLe: null }, quand);
      return publiee ? presenterPourGestion(publiee) : null;
    },

    async fermerOffre(id: string, quand = maintenant()): Promise<OffreCarriereGestion | null> {
      const offreId = lireIdOffre(id);
      const offre = offreId === null ? null : await depot.lireOffre(offreId);
      if (!offre) return null;
      if (offre.fermeeLe !== null && offre.fermeeLe.getTime() <= quand.getTime()) return presenterPourGestion(offre);
      const fermee = await depot.modifierOffre(offre.id, { fermeeLe: quand }, quand);
      return fermee ? presenterPourGestion(fermee) : null;
    },

    async supprimerOffre(id: string): Promise<boolean> {
      const offreId = lireIdOffre(id);
      const supprimee = offreId === null ? null : await depot.supprimerOffre(offreId);
      if (!supprimee) return false;
      await stockage.supprimer(supprimee.cvFichiers).catch(() => 0);
      return true;
    },
  };
}
