// La carte d'un lieu (plats, boissons, formules), remplie par son gérant : mêmes limites dans l'app, sur le site et dans l'API.

import type { EtiquetteCarte } from "../types/carte.ts";

/** Ce qu'une carte peut contenir au plus, et la longueur de chaque texte */
export const LIMITES_CARTE = {
  sections: 20,
  elementsParSection: 60,
  elements: 250,
  titreSection: 40,
  nom: 80,
  description: 200,
  unite: 30,
  /** En euros ; au-delà, c'est sûrement un zéro de trop */
  prixMax: 9999,
} as const;

/** Les repères possibles, dans l'ordre où on les affiche */
export const ETIQUETTES_CARTE: readonly EtiquetteCarte[] = ["vege", "vegan", "sans-gluten", "epice", "fait-maison", "local"];
