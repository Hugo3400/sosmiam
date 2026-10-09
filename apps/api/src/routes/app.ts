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
 * GET /app/version  → 200 { ok, minimale: { ios: "1.2.0", android: "1.2.0" } } : versions « a.b.c » en dessous desquelles
 *                     l'app affiche l'écran « mets à jour » (lien vers le store) ; « 0.0.0 » : rien à demander. Réglées
 *                     par SOS_MIAM_VERSION_MIN_IOS et SOS_MIAM_VERSION_MIN_ANDROID (lues au démarrage de l'API ; une valeur
 *                     mal écrite compte comme « 0.0.0 »). L'app compare elle-même, nombre par nombre.
 */
export function creerRoutesApp(dependances: DependancesApp) {
  const c = creerControleursApp(dependances);
  const routes = Router();
  routes.use(limiterRequetes(LIMITE_APP));
  routes.get("/temps", c.temps);
  routes.get("/version", c.version);
  return routes;
}
