import { EMOJI_AVATAR_PAR_DEFAUT } from "@sos-miam/commun/regles/avatar-par-defaut";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import type { Pote } from "@sos-miam/commun/types/potes";

/** Ce que l'API dit en plus d'une personne (son profil lu au niveau « bande », ou sa place du classement du mois) */
export type DetailsPote = Partial<Pick<Pote, "ville" | "points" | "pointsDuMois" | "rescoussesDuMois" | "lieuxSauves" | "gardes" | "badges">>;

/**
 * Une personne telle que l'API la rend (identifiant public, pseudo, prénom, emoji), au format des écrans de l'app. Ce qui est
 * réservé à la bande (ville, points, lieux sauvés…) vaut vide tant que son profil ou le classement ne l'ont pas donné.
 */
export function convertirPersonneEnPote(personne: PersonneResume, details: DetailsPote = {}): Pote {
  return {
    id: personne.id,
    pseudo: personne.pseudo,
    prenom: personne.prenom,
    // Pas d'avatar sur le serveur (jamais choisi, retiré par l'équipe, ou une photo restée sur son téléphone) : le même que chez elle
    avatar: personne.avatar ?? EMOJI_AVATAR_PAR_DEFAUT,
    ville: details.ville ?? "",
    points: details.points ?? 0,
    pointsDuMois: details.pointsDuMois ?? 0,
    rescoussesDuMois: details.rescoussesDuMois ?? 0,
    lieuxSauves: details.lieuxSauves ?? [],
    gardes: details.gardes ?? [],
    badges: details.badges ?? [],
  };
}
