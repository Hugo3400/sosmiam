// Les seuils de la surveillance des visites (comptes louches, lieux qui refusent beaucoup), réglables dans le logiciel de
// gestion. Valeurs prudentes par défaut (décidé le 9 octobre 2026 : plus de 4 visites validées par jour, ou plus d'un tiers
// refusées). Sans base de données : les contrôleurs les valident sans rien charger d'autre.

export type SeuilsSurveillance = {
  /** Un compte est signalé au-delà de ce nombre de visites validées dans une même journée */
  parJour: number;
  /** Part de refus (en %) à partir de laquelle un compte est signalé… */
  partRefusMin: number;
  /** …s'il a au moins ce nombre de visites décidées (avant, trop tôt pour juger) */
  decisionsMin: number;
  /** Part de refus (en %) à partir de laquelle un lieu est signalé… */
  lieuxPartRefusMin: number;
  /** …s'il a décidé au moins ce nombre de visites */
  lieuxDecisionsMin: number;
  /** Les visites décidées sur ce nombre de jours */
  fenetreJours: number;
};

export const SEUILS_PAR_DEFAUT: SeuilsSurveillance = {
  parJour: 4, partRefusMin: 34, decisionsMin: 6, lieuxPartRefusMin: 34, lieuxDecisionsMin: 10, fenetreJours: 30,
};

/** Les bornes acceptées pour chaque seuil (entiers) */
export const BORNES_SEUILS: Record<keyof SeuilsSurveillance, readonly [number, number]> = {
  parJour: [1, 50], partRefusMin: [1, 100], decisionsMin: [2, 500], lieuxPartRefusMin: [1, 100], lieuxDecisionsMin: [2, 5000], fenetreJours: [1, 365],
};
