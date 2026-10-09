import { Router, type RequestHandler } from "express";

import { creerControleursActivite, type DependancesActivite } from "../controleurs/activite.ts";
import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";

/** Gestes de l'activité : un J'aime ou un « Garder » à chaque publication qu'on fait défiler, par compte */
export const LIMITE_GESTES_ACTIVITE = { fenetre: 10 * 60_000, maximum: 600 };
/** Rescousses données ou reprises (3 par semaine, mais on peut hésiter), par compte */
export const LIMITE_RESCOUSSES = { fenetre: 10 * 60_000, maximum: 30 };

/**
 * /app/activite : l'activité du compte connecté dans l'app (session obligatoire : Authorization: Bearer ou X-Session-Compte).
 * Réponses { ok: true, activite: ActiviteApi } (packages/commun/src/types/activite.ts), jamais en cache ;
 * 401 session-expiree ; 429 trop-de-demandes (Retry-After).
 *
 * GET    /app/activite                         → 200 { ok, activite }
 * POST   /app/activite/rescousses { lieuId }   → 201 { ok, activite, premierSauveteur } : +2 points ; toute première rescousse
 *          d'un lieu nouveau (30 jours) : premier sauveteur, +20 et le badge · 200 si déjà donnée cette semaine (rien ne
 *          change) · 400 champ-invalide { champ: "lieuId" } · 404 lieu-inconnu · 409 lieu-non-verifie | plus-de-rescousse
 *          (3 par semaine, rechargées le lundi à l'heure de Paris)
 * DELETE /app/activite/rescousses/:lieuId      → 200 { ok, activite } : reprend la rescousse de cette semaine (−2 points ;
 *          sans autre rescousse à ce lieu, plus son premier sauveteur : −20) ; rien à reprendre : 200, rien ne change
 * PUT | DELETE /app/activite/gardes/:lieuId                → garder un lieu pour plus tard, ou plus
 * PUT | DELETE /app/activite/jaimes/:publicationId         → aimer une publication, ou plus
 * PUT | DELETE /app/activite/masques/:publicationId        → « Pas intéressé » (pour soi seulement), ou l'annuler
 * PUT | DELETE /app/activite/suivis/lieux/:lieuId          → suivre un lieu, ou plus
 * PUT | DELETE /app/activite/suivis/createurs/:pseudo      → suivre un créateur (pseudo de ses publications), ou plus
 *   → 200 { ok, activite } · 400 champ-invalide { champ: "cible" } · 404 lieu-inconnu | publication-inconnue (seulement en
 *     mettant : retirer marche toujours)
 */
export function creerRoutesActivite(dependances: DependancesActivite, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number) {
  const c = creerControleursActivite(dependances, horloge);
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const gestes = parCompte(LIMITE_GESTES_ACTIVITE);
  const rescousses = parCompte(LIMITE_RESCOUSSES);
  const routes = Router();
  routes.use(limiteConnectee, protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  routes.get("/", c.lire);
  routes.post("/rescousses", rescousses, c.donnerRescousse);
  routes.delete("/rescousses/:lieuId", rescousses, c.reprendreRescousse);
  routes.put("/suivis/:type/:cible", gestes, c.basculer(true));
  routes.delete("/suivis/:type/:cible", gestes, c.basculer(false));
  routes.put("/:type/:cible", gestes, c.basculer(true));
  routes.delete("/:type/:cible", gestes, c.basculer(false));
  routes.use(gererErreursComptes);
  return routes;
}
