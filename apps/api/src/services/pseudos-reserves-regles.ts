// Pseudos libérés, réservés 30 jours (décision de Hugo du 14 octobre 2026, docs/decisions.md) : après un changement de
// pseudo ou la suppression du compte, personne d'autre ne peut le prendre (on répond « pris », sans rien dire de plus) ;
// le même compte peut le reprendre. Base : pseudos-reserves.ts ; mémoire (tests) : pseudos-reserves-en-memoire.ts.

/** Durée de la réservation d'un pseudo libéré */
export const DUREE_RESERVATION_PSEUDO = 30 * 24 * 3600_000;

/** Pourquoi le pseudo a été libéré : changement de pseudo (le compte peut le reprendre) ou compte supprimé (personne) */
export type RaisonReservationPseudo = "changement" | "suppression";

/**
 * Vrai si ce pseudo est réservé, pas expiré, et qu'aucun compte ne le porte aujourd'hui : un ancien lien
 * /invitation/<pseudo> peut alors dire « Ce lien a changé ». Ne dit jamais à qui il appartenait.
 */
export type EstPseudoReserve = (pseudo: string, maintenant?: Date) => Promise<boolean>;

/** Fin de la réservation d'un pseudo libéré à `maintenant` */
export const calculerFinReservation = (maintenant: Date) => new Date(maintenant.getTime() + DUREE_RESERVATION_PSEUDO);
