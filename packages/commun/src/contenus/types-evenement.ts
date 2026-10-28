// Comment on écrit chaque type d'événement d'un lieu (app, espace pro, plus tard le site) : un emoji et un nom.
import type { TarifEvenement, TypeEvenement } from "../types/evenement.ts";
import type { ParLangue, Traduction } from "../types/traduction.ts";
import { TARIFS_EVENEMENT_ECRITS_ANGLAIS, TYPES_EVENEMENT_ECRITS_ANGLAIS } from "./anglais/types-evenement.ts";

export const TYPES_EVENEMENT_ECRITS: Record<TypeEvenement, { emoji: string; nom: string }> = {
  concert: { emoji: "🎸", nom: "Concert" },
  "soiree-theme": { emoji: "🎭", nom: "Soirée à thème" },
  degustation: { emoji: "🧀", nom: "Dégustation" },
  atelier: { emoji: "🧑‍🍳", nom: "Atelier" },
  quiz: { emoji: "🧠", nom: "Quiz" },
  match: { emoji: "⚽", nom: "Match" },
  marche: { emoji: "🧺", nom: "Marché" },
  autre: { emoji: "✨", nom: "Autre" },
};

export const TARIFS_EVENEMENT_ECRITS: Record<TarifEvenement, string> = {
  gratuit: "Gratuit",
  prix: "Prix indicatif",
  reservation: "Sur réservation",
};

export const TYPES_EVENEMENT_ECRITS_PAR_LANGUE: ParLangue<Traduction<typeof TYPES_EVENEMENT_ECRITS>> = { fr: TYPES_EVENEMENT_ECRITS, en: TYPES_EVENEMENT_ECRITS_ANGLAIS };

export const TARIFS_EVENEMENT_ECRITS_PAR_LANGUE: ParLangue<Traduction<typeof TARIFS_EVENEMENT_ECRITS>> = { fr: TARIFS_EVENEMENT_ECRITS, en: TARIFS_EVENEMENT_ECRITS_ANGLAIS };
