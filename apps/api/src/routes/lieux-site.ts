import { Router } from "express";

import { creerControleursLieuxSite } from "../controleurs/lieux-site.ts";
import type { ServicesLieuxSite } from "../services/lieux-site.ts";
import { LIMITE_LIEUX_PUBLICS, limiterVisiteursTransmis } from "./lieux-publics.ts";

/**
 * /lieux/… pour le site (pages « Les lieux » et fiche), en lecture seule, sans session, seulement les lieux publiés.
 * GET /lieux/liste?ville=&type=&q=&page=  → 200 { ok, lieux: LieuListe[], total, page, pages } : 24 par page ; d'abord les
 *                                          lieux vérifiés en SOS ce soir, puis les vérifiés, puis par nom. type : resto,
 *                                          patisserie, bar ou sortie ; q : nom, quartier, info ou plat (60 caractères) ;
 *                                          une page trop grande rend la dernière. LieuListe = LieuPublic + verifie +
 *                                          sos { places } | null. Cache public d'une minute.
 * GET /lieux/villes                      → 200 { ok, villes: [{ ville, nombre }] } : les villes qui ont des lieux publiés,
 *                                          les plus fournies d'abord. Cache public de 5 minutes.
 * GET /lieux/carte?ville=&type=          → 200 { ok, epingles: [{ id, nom, type, latitude, longitude, sos }] } : 3 000 au
 *                                          plus, seulement les lieux qui ont une position. Cache public d'une minute.
 * GET /lieux/accueil                     → 200 { ok, lieux: LieuListe[] } : 8 lieux pour l'accueil, ceux en SOS d'abord,
 *                                          puis restos, pâtisseries, bars et sorties, de villes différentes, tirés à
 *                                          nouveau chaque jour (heure de Paris). Cache public de 5 minutes.
 * GET /lieux/site/:id                    → 200 { ok, lieu: FichePublique + position | null, sos | null, ouverture,
 *                                          etiquettes, autour (4 lieux proches), reservable (réservation SOS Miam dans
 *                                          l'app) } · 404 lieu-inconnu. Cache d'une minute.
 */
export function creerRoutesLieuxSite(services: ServicesLieuxSite, horloge?: () => number) {
  const c = creerControleursLieuxSite(services, horloge);
  const routes = Router();
  const limite = limiterVisiteursTransmis(LIMITE_LIEUX_PUBLICS);
  routes.get("/liste", limite, c.liste);
  routes.get("/villes", limite, c.villes);
  routes.get("/carte", limite, c.carte);
  routes.get("/accueil", limite, c.accueil);
  routes.get("/site/:id", limite, c.fiche);
  return routes;
}
