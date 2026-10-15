// Limitation d'un compte : limiter (règle en cause, pourquoi pour la personne, durée), lever, réexaminer une contestation.
import { appeler } from "./client-gestion.ts";

export type Limitation = {
  id: number; compteId: number; motif: string; motivation: string; debut: string; fin: string | null; leveeLe: string | null;
  contestation: string | null; contesteLe: string | null; reexamineLe: string | null; creeLe: string;
};
export type LimitationEnCours = Omit<Limitation, "leveeLe" | "contestation"> & { compte: { prenom: string; pseudo: string | null } };
/** Durées proposées, en jours (null : jusqu'à nouvel ordre) */
export const DUREES_LIMITATION: { valeur: string; libelle: string; jours: number | null }[] = [
  { valeur: "1", libelle: "1 jour", jours: 1 },
  { valeur: "3", libelle: "3 jours", jours: 3 },
  { valeur: "7", libelle: "7 jours", jours: 7 },
  { valeur: "14", libelle: "14 jours", jours: 14 },
  { valeur: "30", libelle: "30 jours", jours: 30 },
  { valeur: "90", libelle: "90 jours", jours: 90 },
  { valeur: "365", libelle: "1 an", jours: 365 },
  { valeur: "sans-fin", libelle: "Jusqu'à nouvel ordre", jours: null },
];

export const lireLimitationsCompte = (compteId: number) => appeler<{ enVigueur: Limitation | null; toutes: Limitation[] }>("GET", `/comptes/${compteId}/limitations`);
export const listerLimitations = () => appeler<{ enCours: LimitationEnCours[]; contestations: Limitation[] }>("GET", "/limitations");
export const limiterCompte = (compteId: number, choix: { motif: string; motivation: string; jours: number | null }) =>
  appeler<{ ok: true; limitation: Limitation }>("POST", `/comptes/${compteId}/limitations`, { corps: choix });
export const leverLimitation = (id: number, message: string) => appeler<{ ok: true }>("POST", `/limitations/${id}/levee`, { corps: { message } });
export const reexaminerLimitation = (id: number, lever: boolean, message: string) => appeler<{ ok: true }>("POST", `/limitations/${id}/reexamen`, { corps: { lever, message } });
