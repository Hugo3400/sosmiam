import type { SeuilsSurveillance } from "../services/surveillance.ts";

/** Les champs du réglage des seuils, avec les bornes acceptées par l'API (services/gestion/seuils-surveillance.ts) */
export const CHAMPS_SEUILS: readonly { cle: keyof SeuilsSurveillance; libelle: string; aide: string; min: number; max: number }[] = [
  { cle: "parJour", libelle: "Visites validées par jour", aide: "Un compte est signalé au-delà.", min: 1, max: 50 },
  { cle: "partRefusMin", libelle: "Refus d'un compte (%)", aide: "Signalé à partir de cette part…", min: 1, max: 100 },
  { cle: "decisionsMin", libelle: "…sur au moins (visites)", aide: "Avant, trop tôt pour juger.", min: 2, max: 500 },
  { cle: "lieuxPartRefusMin", libelle: "Refus d'un lieu (%)", aide: "Un lieu est signalé à partir de cette part…", min: 1, max: 100 },
  { cle: "lieuxDecisionsMin", libelle: "…sur au moins (visites)", aide: "Visites décidées par le lieu.", min: 2, max: 5000 },
  { cle: "fenetreJours", libelle: "Sur les derniers (jours)", aide: "La période regardée.", min: 1, max: 365 },
];
