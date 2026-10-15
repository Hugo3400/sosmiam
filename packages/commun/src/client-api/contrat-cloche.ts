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
   * jamais. vuesLe : le même sur tous tes téléphones. Sans profil social (lireMoi rend moi: null), rien n'est gardé sur le
   * serveur : lister rend vuesLe: null et le pouls cloche.nonVues: 0 ; l'app garde alors vuesLe sur le téléphone et compte
   * elle-même les notifications plus récentes pour la pastille
   */
  marquerVu(jusqua?: string): Promise<ReponseApi<{ vuesLe: string }>>;
  /**
   * DELETE /app/cloche/:id : efface une de tes notifications, lue ou pas, sur tous tes téléphones ; « notification-inconnue »
   * si elle n'est pas (ou plus) là : déjà effacée ailleurs, rien à refaire
   */
  effacer(id: string): Promise<ReponseApi>;
  /**
   * POST /app/cloche/effacer-lues : efface tes notifications lues, celles pas plus récentes que vuesLe ; jusqua (date ISO) :
   * rien après elle, à donner avec la date « vu » que l'app affiche. Sans profil social (lister rend vuesLe: null), c'est
   * jusqua qui dit ce qui est lu : sans lui, rien n'est effacé. Une même notification qui revient dans les 24 h serait de
   * toute façon remontée « pas vue » : effacer ne fait rien sonner de plus
   */
  effacerLues(jusqua?: string): Promise<ReponseApi<{ effacees: number }>>;
}
