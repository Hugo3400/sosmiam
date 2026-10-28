import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { etiquettesCarte } from "~/contenus/etiquettes-carte";

export const ETIQUETTES_CARTE_ANGLAIS: Traduction<typeof etiquettesCarte> = {
  vege: { emoji: "🌱", libelle: "Veggie", lu: "vegetarian" },
  vegan: { emoji: "🌿", libelle: "Vegan", lu: "vegan" },
  "sans-gluten": { emoji: "🌾", libelle: "Gluten-free", lu: "gluten-free" },
  epice: { emoji: "🌶️", libelle: "Spicy", lu: "spicy" },
  "fait-maison": { emoji: "🏠", libelle: "Homemade", lu: "homemade" },
  local: { emoji: "📍", libelle: "Local", lu: "local produce" },
};
