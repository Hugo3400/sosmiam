import { appeler } from "./client-gestion.ts";

export type ActionServeur = "allumer" | "eteindre" | "redemarrer";

export type EtatProcessus = "en-ligne" | "arrete" | "en-transition" | "en-erreur" | "absent" | "inconnu";

export type ServeurSuivi = {
  id: string;
  nom: string;
  processus: string;
  pilotable: boolean;
  etat: EtatProcessus;
  statutPm2: string | null;
  depuis: string | null;
  memoire: number | null;
  processeur?: number | null;
  redemarrages: number | null;
};

export type EtatServeurs = {
  pm2Repond: boolean;
  serveurs: ServeurSuivi[];
  actionEnCours: { id: string; action: ActionServeur; depuis: string } | null;
};

export const lireServeurs = () => appeler<EtatServeurs>("GET", "/serveurs");

export const agirSurServeur = (id: string, action: ActionServeur) =>
  appeler<{ ok: true; serveur: ServeurSuivi | null }>("POST", `/serveurs/${encodeURIComponent(id)}/action`, { corps: { action } });
