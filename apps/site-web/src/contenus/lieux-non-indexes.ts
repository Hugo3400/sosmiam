// Lieux publiés mais cachés aux moteurs de recherche : la fiche reste visible sur le site et dans l'app, mais elle est en
// « noindex » et hors du plan du site. 2810 : « Restaurant du Capitaine Bouiboui (test) », gardé publié pour les essais de
// l'espace pro (décidé par Hugo le 14 octobre 2026). À retirer d'ici le jour où le lieu de test est dépublié.
export const LIEUX_NON_INDEXES: ReadonlySet<number> = new Set([2810]);
