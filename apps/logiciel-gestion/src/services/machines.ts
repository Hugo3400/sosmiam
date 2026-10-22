import { appeler, parametres } from "./client-gestion.ts";

export type PeriodeCourbes = "1h" | "24h" | "7j" | "30j";

export type MesureRecente = { le: string; processeur: number | null; envoye: number | null };

export type MaintenantMachine = {
  releveLe: string;
  coeurs: number;
  charge: [number, number, number] | null;
  processeur: number | null;
  memoire: { utilisee: number; totale: number } | null;
  echange: { utilise: number; total: number } | null;
  disque: { total: number; libre: number } | null;
  reseau: { interface: string; recu: number | null; envoye: number | null; totalRecu: number; totalEnvoye: number } | null;
  temperature: number | null;
  allumeDepuis: string | null;
  derniereHeure: MesureRecente[];
};

export type Machine = { id: string; nom: string; hote: string; roles: string[]; maintenant: MaintenantMachine | null; problemes: string[] };

export type PointMachine = {
  le: string;
  processeur: number | null;
  memoire: number | null;
  recu: number | null;
  envoye: number | null;
  disque: number | null;
  temperature: number | null;
};

export type CourbesMachine = {
  periode: PeriodeCourbes;
  pas: number;
  debut: string;
  fin: string;
  memoireTotale: number | null;
  disqueTotal: number | null;
  coeurs: number | null;
  points: PointMachine[];
};

export type ServiceSysteme = { unite: string; nom: string; role: string; actif: boolean; etat: string };
export type Gourmand = { nom: string; coeurs: number; role: string | null };
export type SanteSysteme = {
  systeme: string | null;
  noyau: string;
  processeur: { modele: string | null; coeurs: number };
  misesAJour: number | null;
  redemarrageDemande: boolean;
  certificat: { domaine: string; valableJusquau: string | null };
};
export type SystemeMachine = { services: ServiceSysteme[] | null; sante: SanteSysteme; gourmands: Gourmand[] | null };

export const ID_MACHINE_PRINCIPALE = "vps";

export const lireMachines = () => appeler<{ machines: Machine[] }>("GET", "/maintenance/machines");
export const lireCourbesMachine = (id: string, periode: PeriodeCourbes) =>
  appeler<CourbesMachine>("GET", `/maintenance/machines/${encodeURIComponent(id)}/courbes${parametres({ periode })}`);
export const lireSystemeMachine = (id: string) => appeler<SystemeMachine>("GET", `/maintenance/machines/${encodeURIComponent(id)}/systeme`);
