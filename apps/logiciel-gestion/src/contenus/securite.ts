import type { CibleSignalementSecurite, GraviteSignalementSecurite, StatutSignalementSecurite } from "../../../../packages/commun/src/types/securite.ts";

export const STATUTS_SECURITE: { valeur: StatutSignalementSecurite; libelle: string }[] = [
  { valeur: "nouveau", libelle: "Nouveau" },
  { valeur: "en-cours", libelle: "En cours" },
  { valeur: "corrige", libelle: "Corrigé" },
  { valeur: "non-retenu", libelle: "Non retenu" },
  { valeur: "doublon", libelle: "Doublon" },
];

export const GRAVITES_SECURITE: { valeur: GraviteSignalementSecurite | ""; libelle: string }[] = [
  { valeur: "", libelle: "Pas encore évaluée" },
  { valeur: "critique", libelle: "Critique" },
  { valeur: "haute", libelle: "Haute" },
  { valeur: "moyenne", libelle: "Moyenne" },
  { valeur: "basse", libelle: "Basse" },
];

export const CIBLES_SECURITE: Record<CibleSignalementSecurite, string> = {
  site: "Site sosmiam.fr",
  espaces: "Espaces ambassadeur et pro",
  api: "API",
  "app-ios": "App iOS",
  "app-android": "App Android",
};
