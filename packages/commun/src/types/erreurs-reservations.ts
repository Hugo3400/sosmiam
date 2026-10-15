export type ErreurServiceReservations =
  | "lieu-non-reservable"
  | "creneau-invalide"
  | "creneau-complet"
  | "personnes-invalides"
  | "reservation-en-cours"
  | "reservation-en-double"
  | "trop-de-reservations"
  | "hors-fenetre-presence"
  | "horaire-non-propose"
  | "capacite-depassee"
  | "jour-ferme"
  | "reglages-invalides";
