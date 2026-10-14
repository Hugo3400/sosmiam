import type { ProfilInscription } from "@sos-miam/commun/types/compte-app";
import type { Profil } from "@sos-miam/commun/types/profil";

/** Ce que le serveur garde du profil du téléphone : tout sauf les régimes, qui restent sur le téléphone (RGPD, article 9). */
export function preparerProfilEnvoi(profil: Profil): ProfilInscription {
  const envies: Record<string, string[]> = {};
  for (const [categorie, ids] of Object.entries(profil.envies)) {
    if (categorie !== "regimes" && ids && ids.length > 0) envies[categorie] = ids;
  }
  // Nom et pseudo seulement s'ils sont donnés (l'API les laisse alors vides)
  return {
    prenom: profil.prenom,
    ...(profil.nom ? { nom: profil.nom } : {}),
    dateNaissance: profil.dateNaissance,
    ville: profil.ville,
    envies,
    ...(profil.pseudo ? { pseudo: profil.pseudo } : {}),
  };
}
