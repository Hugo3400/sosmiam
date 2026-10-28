import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/**
 * Ton identifiant dans la partie sociale, à comparer aux auteurs, participants, votes et réactions que les écrans affichent
 * (jamais l'id d'un compte : l'app ne le connaît pas) :
 * - avec un compte : celui que la communauté affichée te donne (`moi.id`). Une fois la communauté branchée sur l'API (lot A2),
 *   c'est l'identifiant public de ton profil social (MoiSocial.personne.id), ou « » tant que ce profil n'existe pas ; d'ici
 *   là, elle lit encore les données du téléphone, qui te désignent par « moi » : ce que tu y as écrit reste à toi ;
 * - en visite sans compte : « » (rien n'est à toi : aucun identifiant ne vaut « »).
 * À appeler sous FournisseurCommunaute.
 */
export function utiliserMonId(): string {
  const source = utiliserSourceSociale();
  const { moi } = utiliserCommunaute();
  if (source === "visite") return "";
  return moi.id;
}
