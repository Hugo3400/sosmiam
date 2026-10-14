// Contrat du service des défis, côté client : même route que l'API, GET /app/defis (session obligatoire, jamais en cache ;
// contrat complet dans apps/api/src/routes/defis.ts). La liste est gérée dans le logiciel de gestion ; le serveur compte
// l'avancée (jours à l'heure de Paris), crédite les points une seule fois et les reprend si l'avancée retombe avant la fin.

import type { DefiApp } from "../types/defi.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceDefis {
  /**
   * Les défis publiés, triés par ordre puis premier jour : à venir, en cours, et réussis (même finis) ; un défi fini sans
   * être réussi n'est pas rendu. Erreurs : « connexion-requise », « trop-de-demandes ».
   */
  listerDefis(): Promise<ReponseApi<{ defis: DefiApp[] }>>;
}
