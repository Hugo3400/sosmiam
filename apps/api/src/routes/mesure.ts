import { Router } from "express";

import { creerControleurClic, creerControleurVue } from "../controleurs/mesure.ts";
import type { Vue } from "../services/mesure.ts";

/** /mesure/… : le serveur du site signale les pages vues et les clics de /liens (statistiques de visite, sans cookie). */
export function creerRoutesMesure(enregistrerVue: (vue: Vue) => Promise<void>, enregistrerClic?: (cible: string) => Promise<void>) {
  const routes = Router();
  routes.post("/vue", creerControleurVue(enregistrerVue));
  if (enregistrerClic) routes.post("/clic", creerControleurClic(enregistrerClic));
  return routes;
}
