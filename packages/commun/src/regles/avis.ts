// Avis vérifiés : longueurs, moyenne prudente, part de clients qui reviennent, comptes rendus des ambassadeurs
// (voir docs/decisions.md, « Scan et validation des visites »).

/** Texte d'un avis, espaces du début et de la fin retirés : critique, c'est permis, insulte non */
export const TEXTE_AVIS_MIN = 10;
export const TEXTE_AVIS_MAX = 1000;

/** Réponse publique du lieu à un avis (une par avis) */
export const REPONSE_LIEU_MAX = 600;

/**
 * Moyenne prudente : on part de 5 avis « fictifs » à 4 sur 5, pour qu'un lieu tout neuf ne soit ni noté 5 sur 5
 * grâce à un seul ami, ni coulé par une seule mauvaise note.
 */
export const MOYENNE_A_PRIORI = 4;
export const MOYENNE_POIDS = 5;

/** En dessous de 20 clients différents, la part de clients qui reviennent ne veut rien dire : on ne l'affiche pas */
export const CLIENTS_MIN_PART_RETOUR = 20;

/** Compte rendu d'une mission d'ambassadeur */
export const COMPTE_RENDU_MIN = 5;
export const COMPTE_RENDU_MAX = 2000;
