// L'adresse de l'API, figée à la compilation (EXPO_PUBLIC_API_URL, docs/decisions.md « L'app parle au serveur ») ;
// sans elle, l'API de production.
export const ADRESSE_API = (process.env.EXPO_PUBLIC_API_URL || "https://api.sosmiam.fr").replace(/\/+$/, "");
