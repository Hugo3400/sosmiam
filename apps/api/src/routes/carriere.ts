import express, { Router, type RequestHandler } from "express";

import { creerControleursCarriere } from "../controleurs/carriere.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ServicesCarrierePublics } from "../services/carriere-regles.ts";

export const LIMITE_CANDIDATURES_IP = { fenetre: 3600_000, maximum: 5 };
export const TAILLE_MAX_CORPS_CANDIDATURE = "8mb";

const lireCorps = express.json({ limit: TAILLE_MAX_CORPS_CANDIDATURE });

const lireCorpsCandidature: RequestHandler = (requete, reponse, suite) => {
  lireCorps(requete, reponse, (erreur?: unknown) => {
    if ((erreur as { type?: string } | undefined)?.type === "entity.too.large") return void reponse.status(413).json({ ok: false, erreur: "cv-trop-lourd" });
    suite(erreur);
  });
};

/**
 * /carriere : page « Carrière » du site (décision de Hugo du 21 octobre 2026). Appelées par le serveur du site seulement,
 * en interne (X-IP-Visiteur), jamais par nginx. Erreurs { ok: false, erreur, champ? }.
 * GET  /offres                   → 200 { ok, offres: OffreCarriere[] } : publiées et pas fermées, les plus récentes d'abord
 * GET  /offres/:id               → 200 { ok, offre: OffreCarriere } · 404 offre-inconnue (brouillon, fermée ou inexistante)
 * POST /offres/:id/candidatures  NouvelleCandidature (JSON, 8 Mo au plus, CV en base64) → 201 { ok }
 *        · 400 champ-invalide { champ } (nom 2 à 80, email, message 20 à 3 000, lien https 300 au plus ou null, majeur: true, cv)
 *        · 404 offre-inconnue · 409 offre-fermee · 413 cv-trop-lourd (5 Mo décodé) · 415 cv-format (vrai PDF seulement)
 *        · 429 trop-de-demandes (5 par heure et par IP, 3 par jour et par e-mail ; Retry-After)
 *        · 503 chiffrement-indisponible | stockage-plein. Champ piège site_web rempli : 201 sans rien garder.
 */
export function creerRoutesCarriere(services: ServicesCarrierePublics) {
  const c = creerControleursCarriere(services);
  const routes = Router();
  routes.get("/offres", c.listerOffres);
  routes.get("/offres/:id", c.lireOffre);
  routes.post("/offres/:id/candidatures", limiterRequetes(LIMITE_CANDIDATURES_IP), lireCorpsCandidature, c.deposerCandidature);
  return routes;
}
