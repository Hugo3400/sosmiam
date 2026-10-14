// Règles du chat entre potes (décidées le 8 octobre 2026, voir docs/decisions.md).
// Messages : même longueur et même filtre que les discussions de sortie (LONGUEUR_MAX_MESSAGE, contientMotInterdit).

export const DUREE_MAX_VOCAL_SECONDES = 60;
export const MAX_PARTICIPANTS_GROUPE = 20;
export const LONGUEUR_MAX_TITRE_GROUPE = 40;

/**
 * Les potes ajoutés « en vrai » (par lien, QR code, ou la bande d'exemple), pas par pseudo :
 * ils voient en entier ton profil même s'il est privé (calculerVisibiliteProfil).
 */
export const MOYENS_AJOUT_EN_VRAI: readonly string[] = ["lien", "qr", "exemple"];
