import { Router, type RequestHandler } from "express";

import {
  creerControleurFichePublique, creerControleurLieuxDuPlan, creerControleurLieuxPublics, type ReglagesCachePlan,
} from "../controleurs/lieux-publics.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { FichePublique, LieuDuPlan, LieuPublic } from "../services/lieux-publics.ts";

export const LIMITE_LIEUX_PUBLICS = { fenetre: 60_000, maximum: 120 };
export const LIMITE_PLAN_LIEUX = { fenetre: 10 * 60_000, maximum: 30 };

export function limiterVisiteursTransmis(reglages: { fenetre: number; maximum: number }): RequestHandler {
  const limiter = limiterRequetes(reglages);
  return (requete, reponse, suite) => (requete.get("x-ip-visiteur") ? limiter(requete, reponse, suite) : suite());
}

/**
 * /lieux/… : lecture publique, sans session (chaque adresse n'existe que si son service est fourni).
 * GET /lieux              → 200 { ok, lieux: LieuPublic[] } : les lieux publiés, pour la page d'accueil du site.
 * GET /lieux/publics/:id  → 200 { ok, lieu: { id, nom, type, emoji, info, quartier, ville, prix, couleurs[], decouvertPar,
 *                           adresse, horaires, texte, telephone, siteWeb, instagram, animaux, accessible, terrasse, wifi,
 *                           enfants, parking, paiements[], reservation, estVerifie, source, carte, carteMajLe } } : la fiche d'un lieu PUBLIÉ, pour
 *                           sa page publique (null ou liste vide : info inconnue, à ne pas afficher ; estVerifie : au
 *                           moins un rattachement « valide », badge « ✓ Vérifié », sinon « Non vérifié ») ; jamais la note
 *                           de l'équipe ni qui gère le lieu. carte : CarteLieu de packages/commun (majLe « AAAA-MM-JJ »),
 *                           remplie par le gérant (routes/pro.ts), avec ses éléments « alcool » (le site n'a pas l'âge du
 *                           visiteur : il les montre avec le message sanitaire) ; carteMajLe : moment exact (ISO 8601) ;
 *                           null tous deux : pas de carte. source : SourceLieu de packages/commun (office de tourisme ou
 *                           DATAtourisme d'où viennent le texte et les infos, à citer sur la fiche), ou null. Cache public d'une minute.
 *                           · 404 lieu-inconnu (absent, brouillon ou masqué, ou identifiant mal écrit)
 * GET /lieux/plan         → 200 { ok, lieux: [{ id, modifieLe, indexable }] } : TOUS les lieux publiés (50 000 au plus), rangés par
 *                           id, pour le plan du site (/sitemap.xml) ; modifieLe : dernière modification de la fiche (ISO
 *                           8601) ; indexable : faux pour un lieu non vérifié dont le texte vient d'une source (décision de
 *                           Hugo du 23/10/2026 : hors de Google tant qu'il n'est pas vérifié). Rien d'autre (ni nom, ni ville). Cache public de 5 minutes. Monté à part
 *                           (creerRoutePlanLieux), seulement si son service est fourni.
 */
export function creerRoutesLieuxPublics(lister?: () => Promise<LieuPublic[]>, lireFiche?: (id: number) => Promise<FichePublique | null>) {
  const routes = Router();
  if (lister) routes.get("/", limiterVisiteursTransmis(LIMITE_LIEUX_PUBLICS), creerControleurLieuxPublics(lister));
  if (lireFiche) routes.get("/publics/:id", creerControleurFichePublique(lireFiche));
  return routes;
}

/** GET /lieux/plan (voir le contrat ci-dessus) */
export function creerRoutePlanLieux(lister: () => Promise<LieuDuPlan[]>, cache?: ReglagesCachePlan) {
  const routes = Router();
  routes.get("/plan", limiterVisiteursTransmis(LIMITE_PLAN_LIEUX), creerControleurLieuxDuPlan(lister, cache));
  return routes;
}
