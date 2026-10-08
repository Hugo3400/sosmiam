import { Router } from "express";

import { creerControleurInscription } from "../controleurs/inscriptions.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { NouvelleInscription } from "../services/inscriptions.ts";

/** POST /inscriptions : s'inscrire à la newsletter (5 essais par visiteur toutes les 10 minutes). */
export function creerRoutesInscriptions(enregistrer: (inscription: NouvelleInscription) => Promise<void>) {
  const routes = Router();
  routes.post("/", limiterRequetes({ fenetre: 10 * 60 * 1000, maximum: 5 }), creerControleurInscription(enregistrer));
  return routes;
}
