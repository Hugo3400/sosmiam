import { appeler } from "./client-gestion.ts";

export type Sauvegarde = { nom: string; taille: number; creeLe: string };
export type EtatSauvegardes = { dossier: string; cleExiste: boolean; sauvegardes: Sauvegarde[] };

export const lireSauvegardes = () => appeler<EtatSauvegardes>("GET", "/sauvegardes");
export const sauvegarderMaintenant = () => appeler<Sauvegarde>("POST", "/sauvegardes");
/** Le fichier chiffré d'une sauvegarde (illisible sans la clé de restauration) */
export const telechargerSauvegarde = (nom: string) => appeler<Blob>("GET", `/sauvegardes/${nom}`, { reponse: "blob" });
