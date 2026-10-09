// Infos pratiques d'un lieu, affichées sur sa fiche (décidé le 9 octobre 2026) : de quoi le joindre, s'il accueille les
// animaux, l'accès en fauteuil, ses équipements, ses paiements, la réservation. Toutes facultatives : une info absente
// n'est pas affichée (on ne devine jamais). Plus tard, le lieu les remplit lui-même (mode pro, espace pro du site).

/** Les animaux : bienvenus partout, seulement en terrasse, ou pas d'animaux */
export type AccueilAnimaux = "bienvenus" | "terrasse" | "non";

export type MoyenPaiement = "cb" | "sans-contact" | "especes" | "tickets-resto" | "cheques-vacances";

export type ReservationConseillee = "inutile" | "conseillee" | "obligatoire";

export type InfosPratiques = {
  /** Numéro du lieu, écrit à la française : « 04 67 12 34 56 » */
  telephone?: string;
  /** Site du lieu, adresse complète en https:// */
  siteWeb?: string;
  /** Compte Instagram, sans « @ » */
  instagram?: string;
  animaux?: AccueilAnimaux;
  /** Accessible en fauteuil roulant (entrée et salle) */
  accessible?: boolean;
  terrasse?: boolean;
  wifi?: boolean;
  /** Chaise haute ou menu enfant */
  enfants?: boolean;
  /** Parking facile juste à côté */
  parking?: boolean;
  paiements?: MoyenPaiement[];
  reservation?: ReservationConseillee;
};
