/**
 * Les alertes Miam Safe : l'alerte silencieuse au comptoir (reçue par l'équipe du lieu) et « Prévenir un pote » (reçue par
 * le pote). La personne qui alerte ne reçoit jamais sa propre alerte (le serveur l'écarte des destinataires) : le son ne la
 * trahit pas.
 */
const LIENS_MIAM_SAFE = /^\/(pro\/comptoir|miam-safe\/partage\/\d{1,9})$/;

/**
 * Vrai pour le lien d'une alerte Miam Safe. Elle sonne même app ouverte (décidé le 15 octobre avec la session Miam Safe), mais
 * seulement si le serveur l'a aussi marquée urgente (est-notification-urgente.ts) : /pro/comptoir est aussi l'onglet d'accueil
 * du mode pro, le lien seul ne suffit pas.
 */
export function estAlerteMiamSafe(lien: string | null): boolean {
  return lien !== null && LIENS_MIAM_SAFE.test(lien);
}
