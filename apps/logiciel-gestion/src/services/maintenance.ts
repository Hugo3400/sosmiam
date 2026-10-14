import { appeler } from "./client-gestion.ts";

export type ProcessusServeur = {
  nom: string;
  statut: string;
  depuis: string | null;
  relances: number;
  memoire: number;
  processeur: number;
  relancable: boolean;
};

export type EtatServeur = {
  api: { depuis: string; memoire: number; node: string };
  base: { enLigne: boolean; delai: number | null; octets: number; tables: { table: string; lignes: number }[] };
  site: { enLigne: boolean; statut: number | null; delai: number | null };
  disque: { total: number; libre: number } | null;
  processus: ProcessusServeur[] | null;
  sauvegardes: { cleExiste: boolean; derniere: { nom: string; taille: number; creeLe: string } | null; nombre: number };
};

export const lireEtatServeur = () => appeler<EtatServeur>("GET", "/maintenance");
/** Le ménage que le serveur ne fait pas tout seul (mailsAnciens null : la boîte ne répond pas) */
export const lireMenageManuel = () => appeler<{ mailsAnciens: number | null; aRelancer: number; desinscritsSansDate: number }>("GET", "/maintenance/menage-manuel");
export const relancerProcessus = (processus: string) => appeler<{ ok: true }>("POST", "/maintenance/relancer", { corps: { processus } });
