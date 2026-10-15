/**
 * Les écrans qui se mettent à jour tout seuls (le pouls est relu à chaque notification reçue) : une discussion, une sortie,
 * un profil. Jamais Miam Safe (une alerte se montre toujours), ni les onglets ou les listes, où ce que dit la notification
 * (une campagne sur « / », par exemple) n'est pas forcément à l'écran.
 */
const ECRANS_A_JOUR = /^\/potes\/(discussion|sortie|profil)\/[^/]+$/;

/**
 * Vrai quand ce qu'annonce une notification reçue app ouverte est déjà sous tes yeux : l'écran de son lien (déjà vérifié par
 * lireLienNotification) est celui qui est ouvert, et il se met à jour seul. Elle ne s'affiche alors pas.
 */
export function estDejaSousTesYeux(lien: string | null, ecranOuvert: string | null): boolean {
  return lien !== null && lien === ecranOuvert && ECRANS_A_JOUR.test(lien);
}
