import { appeler, parametres } from "./client-gestion.ts";

export type NiveauLigne = "info" | "avert" | "erreur";
export type FiltreJournal = "tout" | "problemes";
export type SourceJournal = { id: string; nom: string; existe: boolean; horodate: boolean; erreursRecentes: number | null };
export type LigneJournal = { heure: string | null; niveau: NiveauLigne; texte: string; flux: "sortie" | "erreurs" };
export type JournalServeur = { id: string; nom: string; fichiers: string[]; existe: boolean; horodate: boolean; total: number; lignes: LigneJournal[] };

export const lireSourcesJournaux = () => appeler<{ sources: SourceJournal[] }>("GET", "/maintenance/journaux");
export const lireJournalServeur = (id: string, filtre: FiltreJournal) =>
  appeler<JournalServeur>("GET", `/maintenance/journaux/${encodeURIComponent(id)}${parametres({ filtre: filtre === "tout" ? null : filtre })}`);
