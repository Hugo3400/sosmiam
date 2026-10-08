// Villes où SOS Miam se lance (mêmes villes que le site : apps/site-web/src/contenus/villes.ts) : proposées pendant
// qu'on tape sa ville, qui peut aussi être n'importe quelle autre.
// À regrouper dans packages/commun quand l'app rejoindra les espaces de travail npm.
export const villesLancement = ["Montpellier", "Sète", "Béziers", "Pézenas", "Agde", "Lunel", "Lodève", "Palavas-les-Flots"];

/** Longueurs acceptées pour une ville tapée à la main */
export const LONGUEUR_MIN_VILLE = 2;
export const LONGUEUR_MAX_VILLE = 60;
