import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CARTE_DU_LIEU } from "../carte-du-lieu.ts";

export const TEXTES_CARTE_DU_LIEU_ANGLAIS: Traduction<typeof TEXTES_CARTE_DU_LIEU> = {
  gratuit: "Free",
  reperes: "Tags",
  specialiteMaison: "House speciality",
  etiquettes: {
    vege: { libelle: "Veggie", lu: "vegetarian" },
    vegan: { libelle: "Vegan", lu: "vegan" },
    "sans-gluten": { libelle: "Gluten-free", lu: "gluten-free" },
    epice: { libelle: "Spicy", lu: "spicy" },
    "fait-maison": { libelle: "Homemade", lu: "homemade" },
    local: { libelle: "Local", lu: "local produce" },
  },
};
