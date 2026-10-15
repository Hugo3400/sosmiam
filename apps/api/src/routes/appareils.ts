import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";

import { creerControleursAppareils, type DependancesAppareils } from "../controleurs/appareils.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { lireJetonSession, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";

/** Inscriptions et désinscriptions d'un téléphone, par IP */
export const LIMITE_APPAREILS = { fenetre: 10 * 60_000, maximum: 30 };

/**
 * Session facultative : avec une session valable, reponse.locals.compte est rempli ; absente, invalide ou expirée, on passe
 * sans compte (jamais de 401 : inscrire un téléphone ne doit pas dépendre d'une session).
 */
function sessionFacultative(protection: ProtectionComptes): RequestHandler {
  return (requete: Request, reponse: Response, suite: NextFunction) => {
    if (!lireJetonSession(requete)) return suite();
    let passe = false;
    const continuer = () => {
      if (passe) return;
      passe = true;
      suite();
    };
    // Une réponse muette : le refus de exigerCompte (401) est avalé, et on continue sans compte
    const muette = { locals: reponse.locals, status: () => muette, json: () => (continuer(), muette) } as unknown as Response;
    protection.exigerCompte(requete, muette, continuer).catch(continuer);
  };
}

/**
 * /app/appareils : le téléphone s'inscrit aux notifications (APNs sur iPhone, FCM sur Android), sans le service d'Expo.
 * JSON { ok: true } ; erreurs { ok: false, erreur, champ? } ; 429 trop-de-demandes ; jamais en cache.
 *
 * PUT    /app/appareils { jeton (20 à 400 caractères [A-Za-z0-9:_-]), plateforme: "ios" | "android", ville?: string | null
 *          (80 caractères ; la ville choisie dans l'app, jamais une position), offres?: boolean (accord pour les offres des
 *          lieux ; absent : non) } → 200 { ok } : inscrit ou met à jour (un même jeton n'existe qu'une fois et redevient
 *          actif) · 400 champ-invalide { champ: jeton | plateforme | ville | offres }.
 *          Session facultative (Authorization: Bearer ou X-Session-Compte) : valable, le téléphone est lié à ce compte ;
 *          absente, invalide ou expirée, il est inscrit sans compte (jamais de 401). Le compte ne vient jamais du corps.
 * DELETE /app/appareils { jeton } → 200 { ok } : le téléphone est oublié tout de suite (déjà oublié : rien ne change)
 *          · 400 champ-invalide { champ: jeton }.
 * Rien n'est journalisé (ni jeton, ni ville).
 */
export function creerRoutesAppareils(d: DependancesAppareils, protection: ProtectionComptes) {
  const c = creerControleursAppareils(d);
  const routes = Router();
  routes.use(limiterRequetes(LIMITE_APPAREILS), (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  routes.put("/", sessionFacultative(protection), c.inscrire);
  routes.delete("/", c.desinscrire);
  return routes;
}
