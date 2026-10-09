import type { ProfilInscription } from "@sos-miam/commun/types/compte-app";
import type { Profil } from "@sos-miam/commun/types/profil";

/** Ce que le serveur garde du profil du téléphone : tout sauf les régimes, qui restent sur le téléphone (RGPD, article 9). */
export function preparerProfilEnvoi(profil: Profil): ProfilInscription {
  const envies: Record<string, string[]> = {};
  for (const [categorie, ids] of Object.entries(profil.envies)) {
    if (categorie !== "regimes" && ids && ids.length > 0) envies[categorie] = ids;
  }
  return {
    prenom: profil.prenom,
    nom: profil.nom ?? null,
    dateNaissance: profil.dateNaissance,
    ville: profil.ville,
    envies,
    pseudo: profil.pseudo ?? null,
  };
}
