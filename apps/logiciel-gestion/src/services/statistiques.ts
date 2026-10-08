import { appeler, parametres } from "./client-gestion.ts";

export type Echelle = "jour" | "semaine" | "mois" | "annee";
export type SourceStatistiques = "site" | "app";
export type Dimension =
  | "page" | "provenance" | "appareil" | "navigateur" | "systeme" | "pays"
  | "entree" | "sortie" | "campagne" | "langue" | "region" | "ville" | "creneau"
  | "clic" | "robot" | "introuvable" | "temps" | "lente";

export type PeriodeStatistiques = {
  cle: string;
  debut: string;
  fin: string;
  vues: number;
  visites: number;
  visiteurs: number;
  /** Visites terminées, dont celles d'une seule page (rebonds), et leur durée totale en secondes */
  visitesFinies: number;
  rebonds: number;
  dureeVisites: number;
  /** Temps de réponse moyen du serveur, en millisecondes (null si rien de mesuré) */
  tempsMoyen: number | null;
};
export type ConversionsPeriode = { cle: string; inscriptions: number; demandes: number };
export type Classement = { valeur: string; nombre: number }[];

export type Statistiques = {
  echelle: Echelle;
  periodes: PeriodeStatistiques[];
  /** Les mêmes périodes juste avant, pour comparer */
  precedentes: PeriodeStatistiques[];
  conversions: ConversionsPeriode[];
  details: Partial<Record<Dimension, Classement>>;
};
export type EnDirect = { visites: number; pages: Classement };
export type ObjectifMois = { mesure: "visiteurs" | "vues" | "inscriptions"; valeur: number };

/** Les « nombre » dernières périodes (jusqu'à aujourd'hui, ou jusqu'à la date « jusqua », AAAA-MM-JJ) */
export const lireStatistiques = (source: SourceStatistiques, echelle: Echelle, nombre: number, jusqua?: string) =>
  appeler<Statistiques>("GET", `/statistiques${parametres({ source, echelle, nombre, jusqua })}`);
export const lireEnDirect = (source: SourceStatistiques = "site") => appeler<EnDirect>("GET", `/statistiques/direct${parametres({ source })}`);
export const lireObjectif = () => appeler<ObjectifMois | null>("GET", "/objectif");
export const fixerObjectif = (objectif: ObjectifMois | null) =>
  appeler<{ ok: true }>("PUT", "/objectif", { corps: objectif ?? { valeur: null } });

/** La communauté, semaine par semaine (12 semaines) */
export type MesureCommunaute = "comptes" | "ambassadeurs" | "lieuxProposes" | "missions" | "bigSos" | "mails" | "notifications";
export type StatistiquesCommunaute = {
  totaux: { comptes: number; ambassadeursActifs: number; missionsFaites: number; bigSos: number; telephones: number };
  semaines: ({ cle: string } & Record<MesureCommunaute, number>)[];
};
export const lireStatistiquesCommunaute = () => appeler<StatistiquesCommunaute>("GET", "/statistiques/communaute");
