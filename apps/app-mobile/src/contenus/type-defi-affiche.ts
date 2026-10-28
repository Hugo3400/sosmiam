// Un défi tel que l'onglet Profil le montre : celui du serveur (GET /app/defis, avec un compte).

import type { DefiApp } from "@sos-miam/commun/types/defi";

export type DefiAffiche = DefiApp & {
  /**
   * Un défi que le téléphone ne sait pas compter, avec ce qu'il attend (pas de jauge, il ne bouge pas). Toujours null
   * pour un défi du serveur.
   */
  attente: string | null;
};
