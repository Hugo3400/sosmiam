import type { IdBadge } from "../types/badge.ts";
import type { FiltresDefi, MesureDefi } from "../types/defi.ts";

// Badges donnés d'office par le serveur (conception du 14 octobre 2026) : même moteur de mesure que les défis, sans
// dates, jamais de points, donnés une fois et jamais retirés (comme « Premier sauveteur »). Textes dans contenus/badges.ts.

export type BadgeAutomatique = { id: IdBadge; mesure: MesureDefi; filtres: FiltresDefi | null; objectif: number };

export const BADGES_AUTOMATIQUES: readonly BadgeAutomatique[] = [
  { id: "premiere-rescousse", mesure: "rescousses", filtres: null, objectif: 1 },
  { id: "sauveteur-en-serie", mesure: "rescousses", filtres: null, objectif: 10 },
  { id: "second-du-capitaine", mesure: "rescousses", filtres: null, objectif: 25 },
  { id: "heros-de-la-brigade", mesure: "rescousses", filtres: null, objectif: 50 },
  { id: "coeur-sur-la-main", mesure: "visites", filtres: { pendantSos: true }, objectif: 3 },
  { id: "bonne-etoile", mesure: "lieux-differents", filtres: { pendantSos: true }, objectif: 3 },
  { id: "vigie", mesure: "premiers-sauvetages", filtres: null, objectif: 5 },
  { id: "fine-fourchette", mesure: "visites", filtres: { typesLieu: ["resto"] }, objectif: 10 },
  { id: "fourchette-d-or", mesure: "visites", filtres: { typesLieu: ["resto"] }, objectif: 25 },
  { id: "tour-de-table", mesure: "lieux-differents", filtres: { typesLieu: ["resto"] }, objectif: 5 },
  { id: "bec-sucre", mesure: "visites", filtres: { typesLieu: ["patisserie"] }, objectif: 5 },
  { id: "creme-de-la-creme", mesure: "visites", filtres: { typesLieu: ["patisserie"] }, objectif: 20 },
  { id: "as-du-gouter", mesure: "lieux-differents", filtres: { typesLieu: ["patisserie"] }, objectif: 5 },
  { id: "habitue", mesure: "visites", filtres: null, objectif: 25 },
  { id: "mordu-de-miam", mesure: "visites", filtres: null, objectif: 50 },
  { id: "legende-du-miam", mesure: "visites", filtres: null, objectif: 100 },
  { id: "serie-4", mesure: "semaines-d-affilee", filtres: null, objectif: 4 },
  { id: "saison-complete", mesure: "semaines-d-affilee", filtres: null, objectif: 12 },
  { id: "marathon-du-miam", mesure: "semaines-d-affilee", filtres: null, objectif: 26 },
  { id: "un-an-de-miam", mesure: "semaines-d-affilee", filtres: null, objectif: 52 },
  // Décidé le 14 octobre 2026 : 3 visites validées après 22 h, dans tous les lieux (loi Évin : plus « 3 bars »)
  { id: "noctambule", mesure: "visites", filtres: { apresHeure: 22 }, objectif: 3 },
  { id: "fureteur", mesure: "lieux-differents", filtres: null, objectif: 10 },
  { id: "explorateur", mesure: "villes-differentes", filtres: null, objectif: 5 },
  { id: "baroudeur", mesure: "villes-differentes", filtres: null, objectif: 10 },
  { id: "premiere-plume", mesure: "avis", filtres: null, objectif: 1 },
  { id: "plume-de-la-brigade", mesure: "avis", filtres: null, objectif: 5 },
  { id: "plume-d-or", mesure: "avis", filtres: null, objectif: 20 },
  { id: "oeil-de-chef", mesure: "avis", filtres: { avecPhoto: true }, objectif: 5 },
  { id: "objectif-gourmand", mesure: "avis", filtres: { avecPhoto: true }, objectif: 20 },
];
