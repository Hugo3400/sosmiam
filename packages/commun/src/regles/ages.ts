// Règles d'âge de SOS Miam. Décidé par Hugo le 14 octobre 2026 : l'app n'est ouverte qu'à partir de la majorité, 18 ans
// en France, l'âge de la majorité du pays ailleurs (voir docs/decisions.md). Il n'existe plus aucune règle « 15-17 ans ».

/** Âge de la majorité en France */
const MAJORITE_FRANCE = 18;

/**
 * Âge de la majorité de chaque pays où l'app est ouverte (code ISO 3166-1 alpha-2). Un pays s'ajoute ici, avec son âge
 * vérifié, avant d'y ouvrir l'app : un pays absent n'est pas ouvert (lireAgeMajorite rend null).
 */
export const AGES_MAJORITE: Readonly<Record<string, number>> = { FR: MAJORITE_FRANCE };

/** Le pays d'un compte tant qu'on ne le demande pas : l'app n'est ouverte qu'en France */
export const PAYS_PAR_DEFAUT = "FR";

/** Âge minimum pour s'inscrire, partout (app, espace ambassadeur, espace pro) : la majorité en France. */
export const AGE_MINIMUM_INSCRIPTION = MAJORITE_FRANCE;

/**
 * Âge à partir duquel on parle d'alcool : la majorité. Depuis le 14 octobre 2026, tout compte est majeur ; reste utile pour
 * la visite sans compte (âge inconnu : tout public, ni bar ni alcool).
 */
export const AGE_ALCOOL = MAJORITE_FRANCE;
