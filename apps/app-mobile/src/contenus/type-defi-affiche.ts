// Un défi tel que l'onglet Profil le montre : celui du serveur (GET /app/defis, avec un compte), ou un défi d'exemple de la
// démo, calculé sur le téléphone (contenus/defis-exemples.ts, calculerDefiExemple).

import type { DefiApp } from "@sos-miam/commun/types/defi";

export type DefiAffiche = DefiApp & {
  /**
   * Démo seulement : un défi d'exemple que le téléphone ne sait pas compter, avec ce qu'il attend (pas de jauge, il ne
   * bouge pas). Toujours null pour un défi du serveur.
   */
  attente: string | null;
};
