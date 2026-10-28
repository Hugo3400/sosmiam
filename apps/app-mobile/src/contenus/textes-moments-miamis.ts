import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MOMENTS_MIAMIS_ANGLAIS } from "~/contenus/anglais/textes-moments-miamis";

export const TEXTES_MOMENTS_MIAMIS = {
  aLInstant: "à l'instant",
  ilYaMinutes: (minutes: number) => `il y a ${minutes} min`,
  ilYaHeures: (heures: number) => `il y a ${heures} h`,
  hier: "hier",
  ilYaJours: (jours: number) => `il y a ${jours} jours`,
  leJour: (date: string) => `le ${date}`,
  aujourdhui: "Aujourd'hui",
  demain: "Demain",
} as const;

export const TEXTES_MOMENTS_MIAMIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MOMENTS_MIAMIS>> = { fr: TEXTES_MOMENTS_MIAMIS, en: TEXTES_MOMENTS_MIAMIS_ANGLAIS };
