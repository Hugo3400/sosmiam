import { Router } from "express";

import { creerControleursGif } from "../controleurs/gif.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

export const LIMITE_GIF = { fenetre: 60_000, maximum: 30 };

export function creerRoutesGif(d: Pick<DependancesSocialApp, "gif">, contexte: Pick<ContexteRoutesSociales, "lectures" | "parCompte">) {
  const c = creerControleursGif(d.gif);
  const limite = contexte.parCompte(LIMITE_GIF);
  const routes = Router();
  routes.get("/tendances", limite, contexte.lectures, c.tendances);
  routes.get("/recherche", limite, contexte.lectures, c.recherche);
  return routes;
}
