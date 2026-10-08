import { Router } from "express";

import { creerControleurSignalement } from "../controleurs/signalements.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { SignalementRecu } from "../services/gestion/moderation.ts";

/** POST /signalements : signaler une publication (10 signalements par personne toutes les 10 minutes). */
export function creerRoutesSignalements(enregistrer: (signalement: SignalementRecu) => Promise<void>) {
  const routes = Router();
  routes.post("/", limiterRequetes({ fenetre: 10 * 60 * 1000, maximum: 10 }), creerControleurSignalement(enregistrer));
  return routes;
}
