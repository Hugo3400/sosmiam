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
 *
 * Sans profil social (Potes jamais ouvert, mais une décision de la modération reçue) : le « vu » n'est pas gardé sur le
 * serveur (il vit dans le profil social, qu'aucune lecture ne crée). POST /vu rend la date bornée, à garder sur le téléphone ;
 * GET rend vuesLe: null et le pouls cloche.nonVues: 0 : l'app compte elle-même les notifications plus récentes que sa date
 * (choix provisoire, à confirmer par Hugo).
 */
export function creerRoutesCloche(d: Pick<DependancesSocialApp, "cloche">, contexte: ContexteRoutesSociales) {
  const c = creerControleursCloche(d, contexte.horloge);
  const { lireProfilSocial } = contexte.profils;
  const routes = Router();
  routes.get("/", contexte.lectures, lireProfilSocial, c.lister);
  routes.post("/vu", contexte.gestes, lireProfilSocial, c.marquerVu);
  return routes;
}
