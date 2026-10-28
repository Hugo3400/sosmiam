import type { Traduction } from "../../types/traduction.ts";
import type { TARIFS_EVENEMENT_ECRITS, TYPES_EVENEMENT_ECRITS } from "../types-evenement.ts";

export const TYPES_EVENEMENT_ECRITS_ANGLAIS: Traduction<typeof TYPES_EVENEMENT_ECRITS> = {
  concert: { emoji: "🎸", nom: "Live music" },
  "soiree-theme": { emoji: "🎭", nom: "Themed night" },
  degustation: { emoji: "🧀", nom: "Tasting" },
  atelier: { emoji: "🧑‍🍳", nom: "Workshop" },
  quiz: { emoji: "🧠", nom: "Quiz" },
  match: { emoji: "⚽", nom: "Live sport" },
  marche: { emoji: "🧺", nom: "Market" },
  autre: { emoji: "✨", nom: "Other" },
};

export const TARIFS_EVENEMENT_ECRITS_ANGLAIS: Traduction<typeof TARIFS_EVENEMENT_ECRITS> = {
  gratuit: "Free",
  prix: "Approximate price",
  reservation: "Booking required",
};
