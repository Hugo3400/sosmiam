import { Router } from "express";

import { creerControleurInscription } from "../controleurs/inscriptions.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { NouvelleInscription } from "../services/inscriptions.ts";

/**
 * POST /inscriptions : demander la newsletter (5 essais par visiteur toutes les 10 minutes). Rien n'est inscrit tout de
 * suite : l'adresse reçoit un lien de confirmation (POST /newsletter/confirmation), au plus un nouveau toutes les heures et
 * 3 de suite. Toujours 201 { ok: true }, que l'adresse soit nouvelle, en attente ou déjà inscrite.
 */
export function creerRoutesInscriptions(enregistrer: (inscription: NouvelleInscription) => Promise<void>) {
  const routes = Router();
  routes.post("/", limiterRequetes({ fenetre: 10 * 60 * 1000, maximum: 5 }), creerControleurInscription(enregistrer));
  return routes;
}
