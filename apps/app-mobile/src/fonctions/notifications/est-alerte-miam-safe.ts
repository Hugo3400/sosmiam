/**
 * Les alertes Miam Safe : l'alerte silencieuse au comptoir (reçue par l'équipe du lieu) et « Prévenir un pote » (reçue par
 * le pote). Jamais par la personne en difficulté : le son ne la trahit pas.
 */
const LIENS_MIAM_SAFE = /^\/(pro\/comptoir|miam-safe\/partage\/\d{1,9})$/;

/** Vrai pour une alerte Miam Safe : elle sonne même app ouverte (décidé le 15 octobre avec la session Miam Safe) */
export function estAlerteMiamSafe(lien: string | null): boolean {
  return lien !== null && LIENS_MIAM_SAFE.test(lien);
}
