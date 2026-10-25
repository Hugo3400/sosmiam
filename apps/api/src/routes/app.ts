import { Router } from "express";

import { creerControleursApp, type DependancesApp } from "../controleurs/app.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";

/** Heure et version : 120 demandes par visiteur toutes les 10 minutes (l'app les lit au démarrage et au retour au premier plan) */
export const LIMITE_APP = { fenetre: 10 * 60_000, maximum: 120 };

/**
 * /app/… : petites adresses de l'app, SANS session, JSON. Réponses { ok: true, … } ; 429 « trop-de-demandes » au-delà
 * de la limite (Retry-After en secondes).
 *
 * GET /app/temps    → 200 { ok, maintenant: "2026-10-09T22:30:00.000Z" (ISO 8601, UTC), jourParis: "2026-10-10" (le
 *                     jour qu'il est à Paris : c'est lui qui compte pour l'âge) } · jamais en cache
 * GET /app/version  → 200 { ok, minimale: { ios: "1.2.0", android: "1.2.0" }, derniere: { ios: "1.4.0", android: "1.4.0" } } :
 *                     sous minimale, l'app affiche l'écran bloquant « mets à jour » (lien vers le store) ; sous derniere, la
 *                     fenêtre douce « une nouvelle version t'attend », une fois par version ; « 0.0.0 » : rien à demander.
 *                     Lues dans /var/lib/sos-miam/versions-app.json ({ minimale: { ios, android }, derniere: { ios, android } },
 *                     écrit par le logiciel de gestion, relu dès qu'il change), sinon dans SOS_MIAM_VERSION_MIN_IOS,
 *                     SOS_MIAM_VERSION_MIN_ANDROID, SOS_MIAM_VERSION_DERNIERE_IOS et SOS_MIAM_VERSION_DERNIERE_ANDROID ; une
 *                     valeur mal écrite compte comme « 0.0.0 ». L'app compare elle-même, nombre par nombre.
 * GET /app/themes[?ville=Paris]
 *                   → 200 { ok, jour: "2026-12-10" (jour de Paris), themes: ThemeSaisonApi[] } (packages/commun/src/types/
 *                     theme-saison.ts) : les thèmes de saison du jour, le premier pour la bannière, dans la langue de
 *                     X-Langue ; un thème réservé à une ville (pasta-party : Paris) seulement avec ?ville. Cache privé 5 min
 */
export function creerRoutesApp(dependances: DependancesApp) {
  const c = creerControleursApp(dependances);
  const routes = Router();
  routes.use(limiterRequetes(LIMITE_APP));
  routes.get("/temps", c.temps);
  routes.get("/version", c.version);
  routes.get("/themes", c.themes);
  return routes;
}
