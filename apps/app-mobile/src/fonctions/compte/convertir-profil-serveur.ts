import type { ProfilServeur } from "@sos-miam/commun/types/compte-app";
import type { CategorieEnvie, Profil } from "@sos-miam/commun/types/profil";
import { estProfilValide } from "@sos-miam/commun/validation/est-profil-valide";

/**
 * Le profil gardé sur le serveur, au format du téléphone (que tout l'app lit). Les régimes ne sont jamais sur le serveur
 * (RGPD, article 9) : ceux déjà choisis sur ce téléphone sont gardés. null : il manque la date de naissance ou la ville
 * (compte créé sur le site) : « Fais connaissance » doit d'abord les demander.
 */
export function convertirProfilServeur(serveur: ProfilServeur, regimesDuTelephone: string[] | undefined, maintenant: Date = new Date()): Profil | null {
  if (!serveur.dateNaissance || !serveur.ville) return null;
  const envies: Partial<Record<CategorieEnvie, string[]>> = {};
  for (const [categorie, ids] of Object.entries(serveur.envies)) {
    if (categorie !== "regimes" && Array.isArray(ids) && ids.length > 0) envies[categorie as CategorieEnvie] = ids;
  }
  if (regimesDuTelephone && regimesDuTelephone.length > 0) envies.regimes = regimesDuTelephone;
  const profil: Profil = {
    prenom: serveur.prenom,
    ...(serveur.nom ? { nom: serveur.nom } : {}),
    ...(serveur.pseudo ? { pseudo: serveur.pseudo } : {}),
    dateNaissance: serveur.dateNaissance,
    ville: serveur.ville,
    envies,
    creeLe: maintenant.toISOString(),
  };
  return estProfilValide(profil) ? profil : null;
}
