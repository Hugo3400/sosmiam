import type { ProfilServeur } from "@sos-miam/commun/types/compte-app";
import type { CategorieEnvie, Profil } from "@sos-miam/commun/types/profil";
import { estProfilValide } from "@sos-miam/commun/validation/est-profil-valide";
import type { ChampSynchro } from "~/stockage/synchro-profil";

/** Même limite que estProfilValide : un prénom plus long ne s'afficherait pas sur le téléphone */
const LONGUEUR_MAX_PRENOM = 40;

/**
 * Le profil du téléphone mis à jour avec celui du serveur, qui fait foi, sauf pour les champs de `garderLocal` (changés sur
 * ce téléphone, pas encore partis). Les régimes et la date de création restent ceux du téléphone (les régimes ne vont
 * jamais au serveur : RGPD, article 9 ; la date de création sert de clé aux suivis et aux notifications gardés sur le
 * téléphone). Ce que le serveur ne connaît pas (date de naissance, ville d'un compte du site) reste aussi celui du
 * téléphone. Le pseudo est celui du serveur, sauf s'il attend de partir (téléphone d'avant la synchro). null : le résultat
 * ne serait pas un profil valable (rien à écrire).
 */
export function fusionnerProfilServeur(local: Profil, serveur: ProfilServeur, garderLocal: ReadonlySet<ChampSynchro>): Profil | null {
  const prenomServeurLisible = serveur.prenom.trim() !== "" && serveur.prenom.length <= LONGUEUR_MAX_PRENOM;
  const prenom = garderLocal.has("prenom") || !prenomServeurLisible ? local.prenom : serveur.prenom;
  const nom = garderLocal.has("nom") ? local.nom : serveur.nom || undefined;
  const pseudo = garderLocal.has("pseudo") ? local.pseudo : (serveur.pseudo ?? undefined);
  const ville = garderLocal.has("ville") || !serveur.ville ? local.ville : serveur.ville;

  let envies: Partial<Record<CategorieEnvie, string[]>>;
  if (garderLocal.has("envies")) envies = local.envies;
  else {
    envies = {};
    for (const [categorie, ids] of Object.entries(serveur.envies)) {
      if (categorie !== "regimes" && Array.isArray(ids) && ids.length > 0) envies[categorie as CategorieEnvie] = ids;
    }
    if (local.envies.regimes && local.envies.regimes.length > 0) envies.regimes = local.envies.regimes;
  }

  const profil: Profil = {
    prenom,
    ...(nom ? { nom } : {}),
    ...(pseudo ? { pseudo } : {}),
    dateNaissance: serveur.dateNaissance ?? local.dateNaissance,
    ville,
    envies,
    creeLe: local.creeLe,
  };
  return estProfilValide(profil) ? profil : null;
}
