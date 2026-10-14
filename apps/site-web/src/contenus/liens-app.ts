// Liens universels de l'app SOS Miam (iOS et Android) et page d'invitation /invitation/:pseudo.
// Aucun import « ~/… » ici : les tests (tests/liens-app.test.ts) lancent ces fichiers directement avec Node.

/** Le seul hôte qui sert les fichiers d'association : celui que l'app déclare (applinks:sosmiam.fr) */
export const HOTE_LIENS_APP = "sosmiam.fr";
/** Identifiant de l'app iOS pour Apple : « <Team ID>.<bundle identifier> » (apps/app-mobile/app.json) */
export const APP_ID_IOS = "4F7UVS2357.fr.sosmiam.app";
/** Le paquet Android (apps/app-mobile/app.json) */
export const PAQUET_ANDROID = "fr.sosmiam.app";
/** Les adresses du site que l'app ouvre elle-même quand elle est installée */
export const CHEMINS_LIENS_APP = ["/invitation/*", "/l/*", "/lieux/*"];
/** Le schéma de l'app (« scheme » d'app.json) : le bouton « Ouvrir l'app » en secours */
export const SCHEMA_APP = "sosmiam";

/**
 * Les stores : l'app n'y est pas encore (« App en développement · bientôt partout en France », Hero de l'accueil). Le jour
 * où elle y est, mettre ici l'adresse de sa fiche (jamais devinée) : la page d'invitation affichera un lien.
 */
export const STORES_APP: { nom: string; adresse: string | null }[] = [
  { nom: "App Store (iPhone)", adresse: null },
  { nom: "Google Play (Android)", adresse: null },
];
