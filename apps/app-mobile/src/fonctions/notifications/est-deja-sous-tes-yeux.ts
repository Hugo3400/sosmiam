/**
 * Les écrans qui se mettent à jour tout seuls (le pouls est relu à chaque notification reçue) et montrent ce qu'annonce la
 * notification : une discussion, un profil, et la liste des messages (seule une invitation à un groupe y mène, et elle s'y
 * affiche). Pas une sortie : ses messages et ses événements ont le même lien, et l'écran s'ouvre sur le vote, pas sur la
 * discussion. Jamais Miam Safe (une alerte se montre toujours), ni les onglets, où ce que dit la notification (une
 * campagne sur « / », par exemple) n'est pas forcément à l'écran.
 */
const ECRANS_A_JOUR = /^\/potes\/(messages|(discussion|profil)\/[^/]+)$/;

/**
 * Vrai quand ce qu'annonce une notification reçue app ouverte est déjà sous tes yeux : l'écran de son lien (déjà vérifié par
 * lireLienNotification) est celui qui est ouvert, et il se met à jour seul. Elle ne s'affiche alors pas.
 */
export function estDejaSousTesYeux(lien: string | null, ecranOuvert: string | null): boolean {
  return lien !== null && lien === ecranOuvert && ECRANS_A_JOUR.test(lien);
}
