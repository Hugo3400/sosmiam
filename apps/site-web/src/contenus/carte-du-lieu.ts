// Textes de la carte d'un lieu (« Ma carte » de l'espace pro, fiche publique). Les repères ont les mêmes mots que
// apps/app-mobile/src/contenus/etiquettes-carte.ts (fiche de l'app) : les changer des deux côtés.
import { LIMITES_CARTE } from "../../../../packages/commun/src/regles/carte-du-lieu.ts";
import type { EtiquetteCarte } from "../types/carte.ts";

/** Repères d'un plat : emoji (caché aux lecteurs d'écran), mot affiché et mot lu */
export const ETIQUETTES: Record<EtiquetteCarte, { emoji: string; libelle: string; lu: string }> = {
  vege: { emoji: "🌱", libelle: "Végé", lu: "végétarien" },
  vegan: { emoji: "🌿", libelle: "Vegan", lu: "vegan" },
  "sans-gluten": { emoji: "🌾", libelle: "Sans gluten", lu: "sans gluten" },
  epice: { emoji: "🌶️", libelle: "Épicé", lu: "épicé" },
  "fait-maison": { emoji: "🏠", libelle: "Fait maison", lu: "fait maison" },
  local: { emoji: "📍", libelle: "Local", lu: "produits locaux" },
};

/** Ce qui ne passe pas dans un champ de l'éditeur (validerCarteDuLieu de packages/commun) */
export const ERREURS_CARTE = {
  titre: `Donne un titre à cette section (${LIMITES_CARTE.titreSection} caractères au plus, sans gros mot).`,
  nom: `Donne un nom à ce plat (${LIMITES_CARTE.nom} caractères au plus, sans gros mot).`,
  description: `La description fait ${LIMITES_CARTE.description} caractères au plus, sans gros mot.`,
  prixVide: "Indique un prix, comme 12 ou 4,50 (0 si c'est offert).",
  prix: `Un prix entre 0 et ${LIMITES_CARTE.prixMax.toLocaleString("fr-FR")} €, au centime près : 12 ou 4,50, par exemple.`,
  unite: `L'unité fait ${LIMITES_CARTE.unite} caractères au plus, sans gros mot (« le verre », « par personne »).`,
  etiquettes: "Un repère ne passe pas : coche seulement ceux de la liste.",
  autre: "Ce plat ne passe pas : vérifie ses champs.",
  "trop-de-sections": `Ta carte a ${LIMITES_CARTE.sections} sections au plus.`,
  "trop-d-elements": `Ta carte a ${LIMITES_CARTE.elements} plats au plus, et ${LIMITES_CARTE.elementsParSection} par section.`,
} as const;
