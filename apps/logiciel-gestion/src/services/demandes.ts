import { appeler, parametres } from "./client-gestion.ts";
import type { Lieu, SaisieLieu } from "./lieux.ts";

export type StatutDemande = "a-traiter" | "acceptee" | "refusee";

export type DemandeLieu = {
  id: number;
  /** « lieu » : le lieu s'inscrit lui-même (site) ; « communaute » : proposé sur Discord ; « compte » : depuis l'app ;
   * « ambassadeur » : depuis l'espace ambassadeur */
  origine: "lieu" | "communaute" | "compte" | "ambassadeur";
  nom: string;
  type: string | null;
  ville: string;
  adresse: string | null;
  description: string;
  plat: string | null;
  horaires: string | null;
  siteWeb: string | null;
  instagram: string | null;
  contactNom: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  lienDiscord: string | null;
  statut: StatutDemande;
  reponse: string | null;
  lieuId: number | null;
  creeLe: string;
  traiteLe: string | null;
};

export type FileDemandes = { compteurs: Partial<Record<StatutDemande, number>>; demandes: DemandeLieu[] };

export const listerDemandes = (statut: StatutDemande | "") => appeler<FileDemandes>("GET", `/demandes${parametres({ statut })}`);
export const accepterDemande = (id: number, lieu: SaisieLieu, reponse: string) =>
  appeler<Lieu>("POST", `/demandes/${id}/accepter`, { corps: { lieu, reponse } });
export const refuserDemande = (id: number, reponse: string) => appeler<{ ok: true }>("POST", `/demandes/${id}/refuser`, { corps: { reponse } });
export const effacerContactDemande = (id: number) => appeler<{ ok: true }>("DELETE", `/demandes/${id}/contact`);
