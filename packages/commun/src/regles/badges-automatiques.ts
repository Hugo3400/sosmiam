import type { IdBadge } from "../types/badge.ts";
import type { FiltresDefi, MesureDefi } from "../types/defi.ts";

// Badges donnés d'office par le serveur (conception du 14 octobre 2026) : même moteur de mesure que les défis, sans
// dates, jamais de points, donnés une fois et jamais retirés (comme « Premier sauveteur »). Textes dans contenus/badges.ts.

export type BadgeAutomatique = { id: IdBadge; mesure: MesureDefi; filtres: FiltresDefi | null; objectif: number };

export const BADGES_AUTOMATIQUES: readonly BadgeAutomatique[] = [
  { id: "premiere-rescousse", mesure: "rescousses", filtres: null, objectif: 1 },
  { id: "bec-sucre", mesure: "visites", filtres: { typesLieu: ["patisserie"] }, objectif: 5 },
  // Décidé le 14 octobre 2026 : 3 visites validées après 22 h, dans tous les lieux (loi Évin : plus « 3 bars »)
  { id: "noctambule", mesure: "visites", filtres: { apresHeure: 22 }, objectif: 3 },
  { id: "explorateur", mesure: "villes-differentes", filtres: null, objectif: 5 },
  { id: "serie-4", mesure: "semaines-d-affilee", filtres: null, objectif: 4 },
];
