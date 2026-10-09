import { Router } from "express";

import { creerControleurFichePublique, creerControleurLieuxPublics } from "../controleurs/lieux-publics.ts";
import type { FichePublique, LieuPublic } from "../services/lieux-publics.ts";

/**
 * /lieux/… : lecture publique, sans session (chaque adresse n'existe que si son service est fourni).
 * GET /lieux              → 200 { ok, lieux: LieuPublic[] } : les lieux publiés, pour la page d'accueil du site.
 * GET /lieux/publics/:id  → 200 { ok, lieu: { id, nom, type, emoji, info, quartier, ville, prix, couleurs[], decouvertPar,
 *                           adresse, horaires, texte, telephone, siteWeb, instagram, animaux, accessible, terrasse, wifi,
 *                           enfants, parking, paiements[], reservation, estVerifie } } : la fiche d'un lieu PUBLIÉ, pour
 *                           sa page publique (null ou liste vide : info inconnue, à ne pas afficher ; estVerifie : au
 *                           moins un rattachement « valide », badge « ✓ Vérifié », sinon « Non vérifié ») ; jamais la note
 *                           de l'équipe ni qui gère le lieu. Cache public d'une minute.
 *                           · 404 lieu-inconnu (absent, brouillon ou masqué, ou identifiant mal écrit)
 */
export function creerRoutesLieuxPublics(lister?: () => Promise<LieuPublic[]>, lireFiche?: (id: number) => Promise<FichePublique | null>) {
  const routes = Router();
  if (lister) routes.get("/", creerControleurLieuxPublics(lister));
  if (lireFiche) routes.get("/publics/:id", creerControleurFichePublique(lireFiche));
  return routes;
}
