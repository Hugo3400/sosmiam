import { Router } from "express";

import { creerControleursBot } from "../controleurs/bot.ts";
import { verifierSecretBot } from "../middlewares/verifier-secret-bot.ts";

/** /bot/… : ce que le bot Discord envoie (propositions de lieux) et vient chercher (annonces à publier). */
export function creerRoutesBot(dependances: Parameters<typeof creerControleursBot>[0], secret?: string) {
  const c = creerControleursBot(dependances);
  const routes = Router();
  routes.use(verifierSecretBot(secret));
  routes.post("/propositions", c.proposition);
  routes.get("/annonces", c.annonces);
  routes.post("/annonces/:id", c.noterAnnonce);
  return routes;
}
