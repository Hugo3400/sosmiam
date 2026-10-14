// Contrat de la cloche de l'app (compte connecté) : les notifications DANS l'app, mêmes routes que l'API (/app/cloche).
// L'API ne donne que le type, qui agit et sur quoi : le texte est écrit par l'app. Lire la cloche ne crée jamais le profil
// social et ne demande pas de pseudo (les décisions de la modération y arrivent aussi).

import type { PageClocheApi } from "../types/cloche.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceCloche {
  /**
   * GET /app/cloche[?apres=] : 30 par page, la plus récente d'abord, sans celles d'une personne avec qui il y a un blocage ;
   * apres : la `suite` de la page d'avant
   */
  lister(apres?: string): Promise<ReponseApi<{ cloche: PageClocheApi }>>;
  /**
   * POST /app/cloche/vu : la cloche est vue jusqu'à `jusqua` (date ISO), ou jusqu'à maintenant sans lui ; elle ne recule
   * jamais. vuesLe : le même sur tous tes téléphones
   */
  marquerVu(jusqua?: string): Promise<ReponseApi<{ vuesLe: string }>>;
}
