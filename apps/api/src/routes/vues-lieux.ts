import { Router } from "express";

import { creerControleursVuesLieux, type DependancesVuesLieux } from "../controleurs/vues-lieux.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";

/** Vues des fiches : une personne qui fait défiler beaucoup de fiches, par visiteur (IP dans X-IP-Visiteur) */
export const LIMITE_VUES_LIEUX = { fenetre: 10 * 60_000, maximum: 120 };

/**
 * /app/lieux/:id/vue : l'app dit qu'une fiche de lieu vient d'être ouverte, SANS session (une session éventuelle n'est ni
 * demandée ni lue). Les vues servent aux statistiques du lieu (GET /pro/comptoir/lieux/:id/statistiques, routes/comptoir.ts),
 * sans pister personne : un compteur par lieu et par jour de Paris (table vues_lieux), rien d'autre n'est écrit. Une seule
 * vue par visiteur, par lieu et par jour de Paris : le visiteur n'est reconnu que par une empreinte de son IP (préfixe /56 en
 * IPv6), du jour et du lieu, gardée en mémoire et oubliée à minuit. Le routeur ne répond qu'à cette adresse : tout le reste
 * passe au routeur /app suivant.
 *
 * POST /app/lieux/:id/vue (sans corps) → 204 : vue comptée, déjà comptée aujourd'hui, ou plafond du jour atteint (200 000
 *        visiteurs × lieux retenus : au-delà, plus rien n'est compté jusqu'à minuit) · 404 lieu-inconnu (absent, brouillon ou
 *        masqué) · 429 trop-de-demandes (Retry-After) au-delà de 120 vues en 10 minutes par visiteur. Jamais en cache.
 */
export function creerRoutesVuesLieux(dependances: DependancesVuesLieux) {
  const c = creerControleursVuesLieux(dependances);
  const routes = Router();
  routes.post(
    "/lieux/:id/vue",
    (_q, reponse, suite) => {
      reponse.set("Cache-Control", "no-store");
      suite();
    },
    limiterRequetes(LIMITE_VUES_LIEUX),
    c.compter,
  );
  return routes;
}
