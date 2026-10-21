import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import { creerChiffrementSecurite } from "./chiffrement-securite.ts";
import { nettoyerJpeg } from "./nettoyeur-jpeg.ts";
import { creerDepotSecurite } from "./securite-base.ts";
import type { ServicesSecuriteGestion } from "./securite-regles.ts";
import { creerSecurite, type Securite } from "./securite-services.ts";
import { creerStockageSignalementsSecurite } from "./stockage-signalements-securite.ts";

let securiteBranchee: Securite | null = null;

export function brancherSecurite(chiffrement: ChiffrementDonnees | null): Securite {
  securiteBranchee = creerSecurite({
    depot: creerDepotSecurite(), stockage: creerStockageSignalementsSecurite(), chiffrement: creerChiffrementSecurite(chiffrement), nettoyerJpeg,
  });
  return securiteBranchee;
}

const securite = () => securiteBranchee ?? brancherSecurite(null);

export const listerSignalementsSecurite: ServicesSecuriteGestion["listerSignalementsSecurite"] = (filtres) => securite().listerSignalementsSecurite(filtres);
export const lireSignalementSecurite: ServicesSecuriteGestion["lireSignalementSecurite"] = (id) => securite().lireSignalementSecurite(id);
export const changerSignalementSecurite: ServicesSecuriteGestion["changerSignalementSecurite"] = (id, changements, maintenant) => securite().changerSignalementSecurite(id, changements, maintenant);
export const lireImageSignalementSecurite: ServicesSecuriteGestion["lireImageSignalementSecurite"] = (id, numero) => securite().lireImageSignalementSecurite(id, numero);
export const donnerBadgeSignalementSecurite: ServicesSecuriteGestion["donnerBadgeSignalementSecurite"] = (id, maintenant) => securite().donnerBadgeSignalementSecurite(id, maintenant);
export const supprimerSignalementSecurite: ServicesSecuriteGestion["supprimerSignalementSecurite"] = (id) => securite().supprimerSignalementSecurite(id);
export const listerEntreesTableauHonneur: ServicesSecuriteGestion["listerEntreesTableauHonneur"] = () => securite().listerEntreesTableauHonneur();
export const retirerEntreeTableauHonneur: ServicesSecuriteGestion["retirerEntreeTableauHonneur"] = (id) => securite().retirerEntreeTableauHonneur(id);

export const faireLeMenageSecurite = (maintenant = new Date()) => securite().menager(maintenant);
