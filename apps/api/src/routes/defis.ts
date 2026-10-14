import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleursDefis, type DependancesDefisApp } from "../controleurs/defis.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";

/** Lectures des défis, par compte : chacune recompte l'avancée (quelques requêtes sous verrou) */
export const LIMITE_DEFIS = { fenetre: 10 * 60_000, maximum: 60 };

/**
 * /app/defis : les défis du moment et l'avancée du compte connecté (session obligatoire : Authorization: Bearer ou
 * X-Session-Compte). Jamais en cache ; 401 session-expiree ; 429 trop-de-demandes (Retry-After).
 * Décidé le 14 octobre 2026 : la liste est gérée dans le logiciel de gestion (routes /api-gestion/defis) ; le serveur compte
 * l'avancée de chacun entre le premier et le dernier jour du défi (compris, jours à l'heure de Paris).
 *
 * GET /app/defis → 200 { ok, defis: DefiApp[] } (packages/commun/src/types/defi.ts), défis publiés seulement, triés par
 *   ordre puis premier jour :
 *   - etat « a-venir » (fait 0), « en-cours » (fait entre 0 et l'objectif) ou « reussi » (fait = objectif, reussiLe ISO 8601,
 *     même après la fin : une réussite reste acquise) ; un défi fini sans être réussi n'est pas rendu ;
 *   - avant de répondre, l'avancée est recomptée : un défi atteint est réussi et ses points sont crédités une seule fois
 *     (raison « defi », détail « defi:<id> ») ; une réussite retombée sous l'objectif avant la fin (rescousse reprise,
 *     visite retirée) est effacée et ses points repris ; 7 jours après sa fin, un défi pas encore réussi est figé ;
 *   - badges automatiques (packages/commun/src/regles/badges-automatiques.ts) donnés au passage, jamais retirés : ils se
 *     lisent dans le compte (GET /comptes/moi), comme les points.
 *   Mesures : rescousses, premiers sauvetages, visites validées (filtres : types de lieu, après une heure de Paris jusqu'à
 *   5 h, pendant un SOS), lieux ou villes différents de ces visites, plus longue suite de semaines (lundi → dimanche, à
 *   Paris) avec une visite validée, avis publiés (avec photo ou non).
 */
export function creerRoutesDefis(dependances: DependancesDefisApp, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number) {
  const c = creerControleursDefis(dependances, horloge);
  const parCompte = limiterRequetes({ ...LIMITE_DEFIS, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const routes = Router();
  routes.use(limiteConnectee, protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  routes.get("/", parCompte, c.lister);
  routes.use(gererErreursComptes);
  return routes;
}
