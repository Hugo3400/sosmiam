/** Un palier du programme Ambassadeurs : la seule progression de l'app (voir docs/decisions.md). */
export type PalierAmbassadeur = {
  cle: "curieux" | "denicheur" | "ambassadeur-quartier" | "ambassadeur-ville";
  nom: string;
  emoji: string;
  /** Points à partir desquels on y arrive ; null : sur candidature ou invitation, pas aux points */
  seuil: number | null;
};

/** Où en est quelqu'un dans les paliers, d'après ses points. */
export type ProgressionAmbassadeur = {
  actuel: PalierAmbassadeur;
  /** Position du palier actuel (0 pour Curieux) */
  index: number;
  /** Palier suivant, ou null tout en haut */
  suivant: PalierAmbassadeur | null;
  /** Points qu'il manque pour le suivant ; null s'il se fait sur candidature (ou s'il n'y en a pas) */
  reste: number | null;
  /** Avancée vers le palier suivant, de 0 à 1 (1 quand le suivant se fait sur candidature) */
  avancee: number;
};
