import { appeler, parametres } from "./client-gestion.ts";

/** Réglages de la boîte bonjour@ : « pret », ou ce qui manque (fichier absent, mal protégé, incomplet) */
export type EtatReglagesEnvoi = "pret" | "absent" | "mal-protege" | "incomplet";
export type EtatEnvois = {
  reglages: EtatReglagesEnvoi;
  expediteur: string | null;
  serveur: string | null;
  parHeure: number | null;
  enAttente: number;
  derniereHeure: number;
  echecs7Jours: number;
  dernierEnvoi: string | null;
  /** Identifiants refusés… : tous les mails attendent que le fichier de la boîte soit corrigé */
  probleme: { message: string; moment: string } | null;
};
export type Campagne = {
  id: number;
  brouillonId: number | null;
  objet: string;
  ville: string | null;
  total: number;
  creeLe: string;
  statuts: Partial<Record<"en-attente" | "envoye" | "echec" | "annule", number>>;
};
export type EnvoiRecent = {
  id: number;
  type: string;
  destinataire: string;
  objet: string | null;
  statut: "en-attente" | "envoye" | "echec" | "annule";
  essais: number;
  erreur: string | null;
  creeLe: string;
  envoyeLe: string | null;
};
export type ContenuNewsletter = { objet: string; html: string; texte: string };

export const lireEtatEnvois = () => appeler<EtatEnvois>("GET", "/courriels/etat");
export const listerDerniersEnvois = () => appeler<EnvoiRecent[]>("GET", "/courriels/derniers");
export const envoyerEssai = (adresse: string, contenu: ContenuNewsletter) => appeler<{ ok: true }>("POST", "/courriels/essai", { corps: { adresse, ...contenu } });
export const compterDestinataires = (ville: string) => appeler<{ total: number | null }>("GET", `/newsletter/destinataires${parametres({ ville })}`);
export const lancerNewsletter = (contenu: ContenuNewsletter & { brouillonId: number | null; ville: string | null }) =>
  appeler<{ ok: true; id: number; total: number }>("POST", "/newsletter/envois", { corps: contenu });
export const listerCampagnes = () => appeler<Campagne[]>("GET", "/newsletter/envois");
export const annulerCampagne = (id: number) => appeler<{ ok: true; annules: number }>("POST", `/newsletter/envois/${id}/annuler`, { corps: {} });
