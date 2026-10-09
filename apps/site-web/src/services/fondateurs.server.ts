// Fondateurs par ville : recherche de commune et places de sa zone (ville ou département), appels publics à l'API, côté
// serveur uniquement (le navigateur passe par la route du site /communes, jamais directement par l'API). L'IP du visiteur
// (X-IP-Visiteur) ne sert qu'aux limites. Contrat : apps/api/src/routes/fondateurs.ts.
import { appelerApiComptes } from "~/services/comptes.server";
import { simplifierRecherche } from "~/fonctions/texte/simplifier-recherche";
import type { CommuneFondateurs, ZoneFondateurs } from "~/types/compte";

/** Communes dont le nom ou le code postal correspond à la recherche (8 au plus par défaut ; vide : liste vide). */
export function chercherCommunes(recherche: string, ip: string | null, limite = 8) {
  const parametres = new URLSearchParams({ recherche: recherche.slice(0, 80), limite: String(limite) });
  return appelerApiComptes<{ communes: CommuneFondateurs[] }>(`/communes?${parametres}`, { ip });
}

/** La commune (code INSEE) et la zone de fondateurs dont elle dépend, avec ses places ; « commune-inconnue » sinon. */
export function lireZoneDeCommune(code: string, ip: string | null) {
  return appelerApiComptes<{ commune: CommuneFondateurs; zone: ZoneFondateurs }>(`/fondateurs/zone?commune=${encodeURIComponent(code)}`, { ip });
}

/**
 * La zone de la ville écrite dans le compte (texte libre, « Lyon ») : seulement si une commune porte exactement ce nom
 * (la plus peuplée en cas d'homonymes). null sinon, ou si l'API ne répond pas : la page dit alors les places de la France.
 */
export async function trouverZoneDeVille(ville: string, ip: string | null): Promise<{ commune: CommuneFondateurs; zone: ZoneFondateurs } | null> {
  const cherche = simplifierRecherche(ville);
  if (!cherche) return null;
  const reponse = await chercherCommunes(ville, ip, 8);
  if (!reponse.ok) return null;
  const memeNom = reponse.communes.filter((commune) => simplifierRecherche(commune.nom) === cherche);
  const commune = memeNom.sort((a, b) => b.population - a.population)[0];
  if (!commune) return null;
  const zone = await lireZoneDeCommune(commune.code, ip);
  return zone.ok ? { commune: zone.commune, zone: zone.zone } : null;
}
