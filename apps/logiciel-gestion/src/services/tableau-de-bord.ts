import { appeler } from "./client-gestion.ts";
import type { EntreeJournal } from "./journal.ts";
import type { ObjectifMois } from "./statistiques.ts";

export type TotauxPeriode = { vues: number; visites: number; visiteurs: number };

export type TableauDeBord = {
  visites: { jours: (TotauxPeriode & { cle: string })[]; semaine: TotauxPeriode };
  newsletter: { inscrits: number; recents: number; ambassadeurs: number; beta: number };
  moderation: { aTraiter: number; urgents: number };
  demandes: { aTraiter: number };
  /** Objectif du mois, s'il y en a un, et où on en est */
  objectif: (ObjectifMois & { atteint: number; mois: { cle: string; debut: string; fin: string } | null }) | null;
  lieux: Record<string, number>;
  publications: Record<string, number> & { programmees: number };
  journal: EntreeJournal[];
};

export const lireTableauDeBord = () => appeler<TableauDeBord>("GET", "/tableau-de-bord");
