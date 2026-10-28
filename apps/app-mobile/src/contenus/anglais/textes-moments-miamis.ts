import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MOMENTS_MIAMIS } from "~/contenus/textes-moments-miamis";

export const TEXTES_MOMENTS_MIAMIS_ANGLAIS: Traduction<typeof TEXTES_MOMENTS_MIAMIS> = {
  aLInstant: "just now",
  ilYaMinutes: (minutes: number) => `${minutes} min ago`,
  ilYaHeures: (heures: number) => `${heures} hour${heures === 1 ? "" : "s"} ago`,
  hier: "yesterday",
  ilYaJours: (jours: number) => `${jours} days ago`,
  leJour: (date: string) => date,
  aujourdhui: "Today",
  demain: "Tomorrow",
};
