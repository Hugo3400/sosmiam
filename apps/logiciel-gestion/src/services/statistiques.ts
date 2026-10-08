import { appeler, parametres } from "./client-gestion.ts";

export type Echelle = "jour" | "semaine" | "mois" | "annee";
export type SourceStatistiques = "site" | "app";
export type Dimension = "page" | "provenance" | "appareil" | "navigateur" | "systeme" | "pays";

export type PeriodeStatistiques = { cle: string; debut: string; fin: string; vues: number; visites: number; visiteurs: number };
export type Statistiques = {
  echelle: Echelle;
  periodes: PeriodeStatistiques[];
  details: Partial<Record<Dimension, { valeur: string; nombre: number }[]>>;
};

export const lireStatistiques = (source: SourceStatistiques, echelle: Echelle, nombre: number) =>
  appeler<Statistiques>("GET", `/statistiques${parametres({ source, echelle, nombre })}`);
