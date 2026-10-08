import { Router } from "express";

import { creerControleurVue } from "../controleurs/mesure.ts";
import type { Vue } from "../services/mesure.ts";

/** POST /mesure/vue : le serveur du site signale une page vue (statistiques de visite, sans cookie). */
export function creerRoutesMesure(enregistrerVue: (vue: Vue) => Promise<void>) {
  const routes = Router();
  routes.post("/vue", creerControleurVue(enregistrerVue));
  return routes;
}
