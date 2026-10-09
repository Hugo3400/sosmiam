import { appeler } from "./client-gestion.ts";

export type Sauvegarde = { nom: string; taille: number; creeLe: string };
export type EtatSauvegardes = { dossier: string; cleExiste: boolean; sauvegardes: Sauvegarde[] };

export const lireSauvegardes = () => appeler<EtatSauvegardes>("GET", "/sauvegardes");
export const sauvegarderMaintenant = () => appeler<Sauvegarde>("POST", "/sauvegardes");
/** Le fichier chiffré d'une sauvegarde (illisible sans la clé de restauration) */
export const telechargerSauvegarde = (nom: string) => appeler<Blob>("GET", `/sauvegardes/${nom}`, { reponse: "blob" });

/** Résultat d'un test : la sauvegarde déchiffrée et relue en entier, lignes par table face à la base d'aujourd'hui */
export type TestSauvegarde = {
  nom: string; testeLe: string; ok: boolean; erreur: string | null; dureeMs: number; taille: number;
  tables: { table: string; lignes: number; aujourdhui: number | null }[];
};
export const lireDernierTestSauvegarde = () => appeler<TestSauvegarde | null>("GET", "/sauvegardes/test");
export const testerSauvegarde = () => appeler<TestSauvegarde>("POST", "/sauvegardes/test", { corps: {} });
