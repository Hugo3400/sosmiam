import { appeler } from "./client-gestion.ts";

export type PosteAutorise = { id: string; nom: string; origine: "serveur" | "distance"; ajouteLe: string | null; expireLe: string | null; cePoste: boolean };
export type ListePostes = { distanceOuverte: boolean; alertesParMail: boolean; postes: PosteAutorise[] };

export const listerPostes = () => appeler<ListePostes>("GET", "/postes");

export const couperPoste = (id: string) => appeler<{ ok: true }>("DELETE", `/postes/${encodeURIComponent(id)}`);
