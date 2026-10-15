import { Router } from "express";

import { creerControleursCloche } from "../controleurs/cloche.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/**
 * /app/cloche : les notifications DANS l'app. Session obligatoire, jamais en cache, lireProfilSocial (pas besoin de pseudo :
 * les décisions de la modération y arrivent aussi ; le profil social n'est jamais créé ici). Le texte est écrit par l'app :
 * l'API ne donne que le type, qui agit et sur quoi. Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429
 * trop-de-demandes (Retry-After) ; 400 champ-invalide { champ }.
 *
 * GET    /app/cloche[?apres=]      → 200 { ok, cloche: PageClocheApi } : 30 par page, la plus récente d'abord ; sans celles
 *          d'une personne avec qui il y a un blocage ; vuesLe (le même sur tous tes téléphones) ; suite : la page suivante
 *          (null : c'était la dernière) · 400 champ-invalide { champ: "apres" }
 * POST   /app/cloche/vu { jusqua?: string (ISO) } → 200 { ok, vuesLe } : ne recule jamais, ni après maintenant ; sans jusqua :
 *          maintenant · 400 champ-invalide { champ: "jusqua" }
 * DELETE /app/cloche/:id            → 200 { ok } : efface une de tes notifications, lue ou pas, sur tous tes téléphones ·
 *          404 notification-inconnue (pas à toi, déjà effacée, ou d'une personne avec qui il y a un blocage : on ne dit
 *          jamais qu'elle existe) · 400 champ-invalide { champ: "id" }
 * POST   /app/cloche/effacer-lues { jusqua?: string (ISO) } → 200 { ok, effacees } : efface tes notifications lues, celles
 *          pas plus récentes que vuesLe, ni que jusqua s'il est donné, ni que maintenant ; sans profil social, « lue » se
 *          lit sur jusqua (la date « vu » gardée par le téléphone) : sans lui, rien n'est effacé · 400 champ-invalide
 *          { champ: "jusqua" }
 *
 * Sans profil social (Potes jamais ouvert, mais une décision de la modération reçue) : le « vu » n'est pas gardé sur le
 * serveur (il vit dans le profil social, qu'aucune lecture ne crée). POST /vu rend la date bornée, à garder sur le téléphone ;
 * GET rend vuesLe: null et le pouls cloche.nonVues: 0 : l'app compte elle-même les notifications plus récentes que sa date
 * (choix provisoire, à confirmer par Hugo).
 *
 * Effacer ne rouvre aucun doublon : une même notification revenue dans les 24 h aurait de toute façon été remontée « pas
 * vue » (ServicesCloche.noter), elle fait alors une seule ligne neuve ; le son d'une réinvitation à une sortie ne dépend pas
 * de la cloche. Permis à un compte limité : personne d'autre ne voit ta cloche.
 */
export function creerRoutesCloche(d: Pick<DependancesSocialApp, "cloche">, contexte: ContexteRoutesSociales) {
  const c = creerControleursCloche(d, contexte.horloge);
  const { lireProfilSocial } = contexte.profils;
  const routes = Router();
  routes.get("/", contexte.lectures, lireProfilSocial, c.lister);
  routes.post("/vu", contexte.gestes, lireProfilSocial, c.marquerVu);
  routes.post("/effacer-lues", contexte.gestes, lireProfilSocial, c.effacerLues);
  routes.delete("/:id", contexte.gestes, lireProfilSocial, c.effacer);
  return routes;
}
