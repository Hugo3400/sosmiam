import type { NouvelleCandidature } from "../../../../packages/commun/src/types/carriere.ts";
import { creerDepotCarriere } from "./carriere-base.ts";
import type { FiltresCandidatures, ServicesCarriereGestion, ServicesCarrierePublics } from "./carriere-regles.ts";
import { creerCarriere, type Carriere } from "./carriere-services.ts";
import { creerChiffrementCarriere } from "./chiffrement-carriere.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import { creerStockageCandidatures } from "./stockage-candidatures.ts";

let carriereBranchee: Carriere | null = null;

export function brancherCarriere(chiffrement: ChiffrementDonnees | null): Carriere {
  carriereBranchee = creerCarriere({ depot: creerDepotCarriere(), stockage: creerStockageCandidatures(), chiffrement: creerChiffrementCarriere(chiffrement) });
  return carriereBranchee;
}

const carriere = () => carriereBranchee ?? brancherCarriere(null);

export const listerOffresPubliees: ServicesCarrierePublics["listerOffresPubliees"] = () => carriere().listerOffresPubliees();
export const lireOffrePubliee: ServicesCarrierePublics["lireOffrePubliee"] = (id) => carriere().lireOffrePubliee(id);
export const deposerCandidature = (offreId: string, candidature: NouvelleCandidature, maintenant?: Date) => carriere().deposerCandidature(offreId, candidature, maintenant);

export const listerOffresGestion: ServicesCarriereGestion["listerOffresGestion"] = () => carriere().listerOffresGestion();
export const creerOffre: ServicesCarriereGestion["creerOffre"] = (donnees, maintenant) => carriere().creerOffre(donnees, maintenant);
export const modifierOffre: ServicesCarriereGestion["modifierOffre"] = (id, donnees, maintenant) => carriere().modifierOffre(id, donnees, maintenant);
export const publierOffre: ServicesCarriereGestion["publierOffre"] = (id, maintenant) => carriere().publierOffre(id, maintenant);
export const fermerOffre: ServicesCarriereGestion["fermerOffre"] = (id, maintenant) => carriere().fermerOffre(id, maintenant);
export const supprimerOffre: ServicesCarriereGestion["supprimerOffre"] = (id) => carriere().supprimerOffre(id);
export const listerCandidatures = (filtres: FiltresCandidatures = {}) => carriere().listerCandidatures(filtres);
export const lireCvCandidature: ServicesCarriereGestion["lireCvCandidature"] = (id) => carriere().lireCvCandidature(id);
export const changerStatutCandidature: ServicesCarriereGestion["changerStatutCandidature"] = (id, statut, maintenant) => carriere().changerStatutCandidature(id, statut, maintenant);
export const supprimerCandidature: ServicesCarriereGestion["supprimerCandidature"] = (id) => carriere().supprimerCandidature(id);

export const faireLeMenageCarriere = (maintenant = new Date()) => carriere().menager(maintenant);
