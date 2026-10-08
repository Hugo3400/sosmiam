import type { EtiquetteCarte } from "@sos-miam/commun/types/carte";

/**
 * Repères d'un élément de la carte : ce qui s'affiche (emoji et mot court) et ce que lisent VoiceOver et TalkBack
 * (sans emoji : ils en diraient le nom, « plant », « maison »…).
 */
export const etiquettesCarte: Record<EtiquetteCarte, { emoji: string; libelle: string; lu: string }> = {
  vege: { emoji: "🌱", libelle: "Végé", lu: "végétarien" },
  vegan: { emoji: "🌿", libelle: "Vegan", lu: "vegan" },
  "sans-gluten": { emoji: "🌾", libelle: "Sans gluten", lu: "sans gluten" },
  epice: { emoji: "🌶️", libelle: "Épicé", lu: "épicé" },
  "fait-maison": { emoji: "🏠", libelle: "Fait maison", lu: "fait maison" },
  local: { emoji: "📍", libelle: "Local", lu: "produits locaux" },
};
