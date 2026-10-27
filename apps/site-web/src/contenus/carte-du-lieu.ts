// Textes de la carte d'un lieu (« Ma carte » de l'espace pro, fiche publique). Les repères ont les mêmes mots que
// apps/app-mobile/src/contenus/etiquettes-carte.ts (fiche de l'app) : les changer des deux côtés.
import { LIMITES_CARTE } from "../../../../packages/commun/src/regles/carte-du-lieu.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import type { EtiquetteCarte } from "../types/carte.ts";
import { TEXTES_CARTE_DU_LIEU_ANGLAIS } from "./anglais/carte-du-lieu.ts";

export const TEXTES_CARTE_DU_LIEU = {
  gratuit: "Gratuit",
  reperes: "Repères",
  specialiteMaison: "Spécialité de la maison",
  etiquettes: {
    vege: { libelle: "Végé", lu: "végétarien" },
    vegan: { libelle: "Vegan", lu: "vegan" },
    "sans-gluten": { libelle: "Sans gluten", lu: "sans gluten" },
    epice: { libelle: "Épicé", lu: "épicé" },
    "fait-maison": { libelle: "Fait maison", lu: "fait maison" },
    local: { libelle: "Local", lu: "produits locaux" },
  } satisfies Record<EtiquetteCarte, { libelle: string; lu: string }>,
};

export const TEXTES_CARTE_DU_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARTE_DU_LIEU>> = {
  fr: TEXTES_CARTE_DU_LIEU,
  en: TEXTES_CARTE_DU_LIEU_ANGLAIS,
};

export const EMOJIS_ETIQUETTES: Record<EtiquetteCarte, string> = {
  vege: "🌱",
  vegan: "🌿",
  "sans-gluten": "🌾",
  epice: "🌶️",
  "fait-maison": "🏠",
  local: "📍",
};

/** Repères d'un plat : emoji (caché aux lecteurs d'écran), mot affiché et mot lu */
export const ETIQUETTES = Object.fromEntries(
  (Object.keys(EMOJIS_ETIQUETTES) as EtiquetteCarte[]).map((cle) => [cle, { emoji: EMOJIS_ETIQUETTES[cle], ...TEXTES_CARTE_DU_LIEU.etiquettes[cle] }]),
) as Record<EtiquetteCarte, { emoji: string; libelle: string; lu: string }>;

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
