import { villesFrance } from "@sos-miam/commun/contenus/villes-france";

// Villes proposées pendant qu'on tape sa ville, partout en France (la liste et les coordonnées sont dans
// packages/commun/src/contenus/villes-france.ts) : on peut aussi en écrire n'importe quelle autre.

/** Villes où SOS Miam se lance en premier (mêmes villes que le site) : proposées avant les autres */
export const villesLancement = villesFrance.filter((ville) => ville.lancement).map((ville) => ville.valeur);

/** Toutes les villes connues, villes de lancement d'abord, telles qu'elles s'écrivent (homonymes précisés : « Saint-Denis (La Réunion) ») */
export const villesConnues = [...villesLancement, ...villesFrance.filter((ville) => !ville.lancement).map((ville) => ville.valeur)];

/** Longueurs acceptées pour une ville tapée à la main */
export const LONGUEUR_MIN_VILLE = 2;
export const LONGUEUR_MAX_VILLE = 60;
