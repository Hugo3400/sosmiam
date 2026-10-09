// « Ambassadeur certifié » (docs/decisions.md) : candidatures envoyées depuis l'espace, décidées ici, et titre retiré ici.
import { appeler, parametres } from "./client-gestion.ts";
import type { Palier, StatutAmbassadeur } from "./ambassadeurs.ts";

export type ProfilCertifie = "ambassadeur" | "pro" | "structure";
type CompteCertification = {
  id: number; prenom: string; email: string; emailVerifieLe: string | null; points: number; palier: Palier;
  ambassadeur: { ville: string; quartier: string | null; statut: StatutAmbassadeur; certifieLe: string | null; profilCertifie: ProfilCertifie | null; structure: string | null } | null;
};
export type CandidatureCertification = {
  id: number;
  compteId: number;
  profil: ProfilCertifie;
  structure: string | null;
  communeCode: string;
  commune: { nom: string; nomDepartement: string; codeDepartement: string } | null;
  aide: string;
  envies: string;
  engagementGratuit: boolean;
  statut: "en-attente" | "acceptee" | "refusee";
  creeLe: string;
  reponduLe: string | null;
  compte: CompteCertification;
};
export type Certifie = CompteCertification & { _count: { missions: number } };

export const listerCandidaturesCertification = (statut: string) => appeler<CandidatureCertification[]>("GET", `/certifications${parametres({ statut })}`);
export const listerCertifies = () => appeler<Certifie[]>("GET", "/certifies");
/** bienvenue : le mail de bienvenue est parti dans la file (faux si l'envoi des mails n'est pas réglé) */
export const accepterCertification = (id: number) => appeler<{ ok: true; bienvenue: boolean }>("POST", `/certifications/${id}/accepter`, { corps: {} });
export const refuserCertification = (id: number) => appeler<{ ok: true }>("POST", `/certifications/${id}/refuser`, { corps: {} });
export const retirerCertification = (compteId: number) => appeler<{ ok: true }>("POST", `/ambassadeurs/${compteId}/certification/retirer`, { corps: {} });
