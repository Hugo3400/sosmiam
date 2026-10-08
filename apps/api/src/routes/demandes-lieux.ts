import { Router } from "express";

import { creerControleurDemandeLieu } from "../controleurs/demandes-lieux.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { NouvelleDemandeLieu } from "../services/demandes-lieux.ts";

/** POST /demandes-lieux : un lieu demande à être sur SOS Miam (3 demandes par visiteur toutes les 30 minutes). */
export function creerRoutesDemandesLieux(enregistrer: (demande: NouvelleDemandeLieu) => Promise<void>) {
  const routes = Router();
  routes.post("/", limiterRequetes({ fenetre: 30 * 60 * 1000, maximum: 3 }), creerControleurDemandeLieu(enregistrer));
  return routes;
}
