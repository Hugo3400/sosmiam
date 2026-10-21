import type { CandidatureGestion, DonneesOffreCarriere, OffreCarriereGestion, StatutCandidature } from "../../../../packages/commun/src/types/carriere.ts";
import { appeler, parametres } from "./client-gestion.ts";

export const listerOffresCarriere = () => appeler<{ offres: OffreCarriereGestion[] }>("GET", "/carriere/offres");
export const creerOffreCarriere = (donnees: DonneesOffreCarriere) => appeler<{ ok: true; offre: OffreCarriereGestion }>("POST", "/carriere/offres", { corps: donnees });
export const modifierOffreCarriere = (id: string, donnees: DonneesOffreCarriere) => appeler<{ ok: true; offre: OffreCarriereGestion }>("PUT", `/carriere/offres/${id}`, { corps: donnees });
export const publierOffreCarriere = (id: string) => appeler<{ ok: true }>("POST", `/carriere/offres/${id}/publication`, { corps: {} });
export const fermerOffreCarriere = (id: string) => appeler<{ ok: true }>("POST", `/carriere/offres/${id}/fermeture`, { corps: {} });
export const supprimerOffreCarriere = (id: string) => appeler<{ ok: true }>("DELETE", `/carriere/offres/${id}`);
export const listerCandidaturesCarriere = (offre: string, statut: StatutCandidature | "") =>
  appeler<{ candidatures: CandidatureGestion[] }>("GET", `/carriere/candidatures${parametres({ offre, statut })}`);
export const lireCvCandidature = (id: string) => appeler<Blob>("GET", `/carriere/candidatures/${id}/cv`, { reponse: "blob" });
export const changerStatutCandidature = (id: string, statut: StatutCandidature) => appeler<{ ok: true }>("POST", `/carriere/candidatures/${id}/statut`, { corps: { statut } });
export const supprimerCandidatureCarriere = (id: string) => appeler<{ ok: true }>("DELETE", `/carriere/candidatures/${id}`);
