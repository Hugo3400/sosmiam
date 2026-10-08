import { appeler, parametres } from "./client-gestion.ts";

export type EntreeJournal = { id: number; moment: string; poste: string; action: string; detail: string | null };
export type PageJournal = { total: number; parPage: number; entrees: EntreeJournal[] };

export const lireJournal = (page: number) => appeler<PageJournal>("GET", `/journal${parametres({ page })}`);
