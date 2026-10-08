import { appeler } from "./client-gestion.ts";
import type { EntreeJournal } from "./journal.ts";

export type TotauxPeriode = { vues: number; visites: number; visiteurs: number };

export type TableauDeBord = {
  visites: { jours: (TotauxPeriode & { cle: string })[]; semaine: TotauxPeriode };
  newsletter: { inscrits: number; recents: number; ambassadeurs: number; beta: number };
  moderation: { aTraiter: number; urgents: number };
  lieux: Record<string, number>;
  publications: Record<string, number> & { programmees: number };
  journal: EntreeJournal[];
};

export const lireTableauDeBord = () => appeler<TableauDeBord>("GET", "/tableau-de-bord");
