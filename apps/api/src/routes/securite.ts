import express, { Router, type RequestHandler } from "express";

import { creerControleursSecurite } from "../controleurs/securite.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ServicesSecuritePublics } from "../services/securite-regles.ts";

export const LIMITE_SIGNALEMENTS_IP = { fenetre: 3600_000, maximum: 5 };
export const TAILLE_MAX_CORPS_SIGNALEMENT = "22mb";

const lireCorps = express.json({ limit: TAILLE_MAX_CORPS_SIGNALEMENT });

const lireCorpsSignalement: RequestHandler = (requete, reponse, suite) => {
  lireCorps(requete, reponse, (erreur?: unknown) => {
    if ((erreur as { type?: string } | undefined)?.type === "entity.too.large") return void reponse.status(413).json({ ok: false, erreur: "image-trop-lourde" });
    suite(erreur);
  });
};

/**
 * /securite : page « Chasse aux bugs » du site (sosmiam.fr/securite, décision de Hugo du 22 octobre 2026). Appelées par le
 * serveur du site seulement, en interne (X-IP-Visiteur), jamais exposées par nginx. Erreurs { ok: false, erreur, champ? }.
 * GET  /tableau-honneur → 200 { ok, entrees: EntreeTableauHonneur[] } : { nom, mois: "AAAA-MM" }, les plus récentes d'abord
 * POST /signalements    NouveauSignalementSecurite (JSON, 22 Mo au plus, images en base64) → 201 { ok }
 *        · 400 champ-invalide { champ } (nom 2 à 80, email, cible, titre 5 à 120, description 30 à 10 000, lien https 300 au
 *          plus ou null, majeur: true, reglesAcceptees: true, nomTableauHonneur 2 à 40 ou null, images)
 *        · 400 trop-d-images (3 au plus) · 413 image-trop-lourde (5 Mo décodé, ou corps trop gros)
 *        · 415 image-format (vrai PNG ou vrai JPEG seulement, reconnus et vérifiés par leur contenu ; métadonnées retirées)
 *        · 429 trop-de-demandes (5 par heure et par IP, 3 par jour et par e-mail ; Retry-After)
 *        · 503 chiffrement-indisponible | stockage-plein. Champ piège site_web rempli : 201 sans rien garder.
 */
export function creerRoutesSecurite(services: ServicesSecuritePublics) {
  const c = creerControleursSecurite(services);
  const routes = Router();
  routes.get("/tableau-honneur", c.listerTableauHonneur);
  routes.post("/signalements", limiterRequetes(LIMITE_SIGNALEMENTS_IP), lireCorpsSignalement, c.deposerSignalement);
  return routes;
}
