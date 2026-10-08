import { Router } from "express";

import { creerControleurLocalisation } from "../controleurs/localisation.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { Commune } from "../services/localisation.ts";

/** POST /localisation : la commune qui contient une position (20 demandes par visiteur toutes les 10 minutes). */
export function creerRoutesLocalisation(trouver: (latitude: number, longitude: number) => Promise<Commune | null>) {
  const routes = Router();
  routes.post("/", limiterRequetes({ fenetre: 10 * 60 * 1000, maximum: 20 }), creerControleurLocalisation(trouver));
  return routes;
}
