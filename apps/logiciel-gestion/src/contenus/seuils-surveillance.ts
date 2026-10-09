import type { SeuilsSurveillance } from "../services/surveillance.ts";

/** Les champs du réglage des seuils, rangés par ligne de la fenêtre (comptes, puis lieux et période) */
export const CHAMPS_SEUILS: readonly { cle: keyof SeuilsSurveillance; ligne: "comptes" | "lieux"; libelle: string; aide: string; min: number; max: number }[] = [
  { cle: "parJour", ligne: "comptes", libelle: "Visites validées par jour", aide: "Un compte est signalé au-delà.", min: 1, max: 50 },
  { cle: "partRefusMin", ligne: "comptes", libelle: "Part de refus (%)", aide: "Signalé à partir de cette part…", min: 1, max: 100 },
  { cle: "decisionsMin", ligne: "comptes", libelle: "Sur au moins (visites)", aide: "Avant, trop tôt pour juger.", min: 2, max: 500 },
  { cle: "lieuxPartRefusMin", ligne: "lieux", libelle: "Part de refus (%)", aide: "Un lieu est signalé à partir de cette part…", min: 1, max: 100 },
  { cle: "lieuxDecisionsMin", ligne: "lieux", libelle: "Sur au moins (visites)", aide: "Visites décidées par le lieu.", min: 2, max: 5000 },
  { cle: "fenetreJours", ligne: "lieux", libelle: "Sur les derniers (jours)", aide: "La période regardée, pour tout.", min: 1, max: 365 },
];
