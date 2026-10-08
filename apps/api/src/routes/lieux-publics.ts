import { Router } from "express";

import { creerControleurLieuxPublics } from "../controleurs/lieux-publics.ts";
import type { LieuPublic } from "../services/lieux-publics.ts";

/** GET /lieux : les lieux publiés, pour la page d'accueil du site (lecture seule). */
export function creerRoutesLieuxPublics(lister: () => Promise<LieuPublic[]>) {
  const routes = Router();
  routes.get("/", creerControleurLieuxPublics(lister));
  return routes;
}
