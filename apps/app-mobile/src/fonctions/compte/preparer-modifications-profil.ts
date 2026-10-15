import type { ServiceCompte } from "@sos-miam/commun/client-api/contrat-compte";
import type { Profil } from "@sos-miam/commun/types/profil";
import type { ChampSynchro } from "~/stockage/synchro-profil";

/** Le corps de PATCH /comptes/moi/profil (un champ absent reste inchangé sur le serveur) */
export type ModificationsProfil = Parameters<ServiceCompte["modifierProfil"]>[0];

/**
 * Ce qui part au serveur pour les champs demandés, et rien d'autre. Le nom vide part en null (sinon, absent voudrait dire
 * « inchangé » et il ne serait jamais effacé). Les envies partent toutes, puisqu'elles remplacent les anciennes, mais jamais
 * les régimes (RGPD, article 9). Le pseudo seulement s'il est demandé et qu'il existe. L'avatar (`avatar` : ton emoji ou
 * « miami:<id> », vu par ecrireAvatarPublic) aussi : une photo (null) ne part jamais, et le téléphone n'efface jamais celui
 * du serveur. Jamais la date de naissance ni « privé » : ils ont leurs propres chemins.
 */
export function preparerModificationsProfil(profil: Profil, champs: Iterable<ChampSynchro>, avatar: string | null): ModificationsProfil {
  const modifs: ModificationsProfil = {};
  for (const champ of new Set(champs)) {
    if (champ === "prenom") modifs.prenom = profil.prenom;
    else if (champ === "nom") modifs.nom = profil.nom?.trim() ? profil.nom.trim() : null;
    else if (champ === "ville") modifs.ville = profil.ville;
    else if (champ === "pseudo" && profil.pseudo) modifs.pseudo = profil.pseudo;
    else if (champ === "avatar" && avatar) modifs.avatar = avatar;
    else if (champ === "envies") {
      const envies: Record<string, string[]> = {};
      for (const [categorie, ids] of Object.entries(profil.envies)) {
        if (categorie !== "regimes" && ids && ids.length > 0) envies[categorie] = [...new Set(ids)];
      }
      modifs.envies = envies;
    }
  }
  return modifs;
}
