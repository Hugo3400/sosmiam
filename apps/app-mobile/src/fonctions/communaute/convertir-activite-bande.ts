import { BADGES_PAR_LANGUE } from "@sos-miam/commun/contenus/badges";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ActiviteBandeApi } from "@sos-miam/commun/types/bande";
import type { ActivitePote } from "@sos-miam/commun/types/potes";

/**
 * Une ligne de « Quoi de neuf » telle que l'API la rend, au format des écrans : le pote par son identifiant public, et pour un
 * badge son nom en toutes lettres (l'API donne son code). L'id de la ligne reste celui de l'API : c'est lui qu'on masque.
 */
export function convertirActiviteBande(activite: ActiviteBandeApi, langue: Langue): ActivitePote {
  const detail = activite.type === "badge" ? (choisirTextes(BADGES_PAR_LANGUE, langue).find((b) => b.id === activite.detail)?.nom ?? activite.detail) : activite.detail;
  return {
    id: activite.id,
    pote: activite.personne.id,
    type: activite.type,
    ...(activite.lieuId !== undefined ? { lieuId: activite.lieuId } : {}),
    ...(detail !== undefined ? { detail } : {}),
    date: activite.date,
  };
}
