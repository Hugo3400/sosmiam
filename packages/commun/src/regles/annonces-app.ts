export const CIBLES_ANNONCE_APP = ["tous", "ville", "pros", "ambassadeurs"] as const;
export type CibleAnnonceApp = (typeof CIBLES_ANNONCE_APP)[number];

export const TITRE_ANNONCE_APP_MAX = 60;
export const TEXTE_ANNONCE_APP_MAX = 300;
export const BOUTON_ANNONCE_APP_MAX = 30;
export const LIEN_ANNONCE_APP_MAX = 200;
export const DELAI_RETOUR_ANNONCE_APP_MS = 30 * 60_000;
