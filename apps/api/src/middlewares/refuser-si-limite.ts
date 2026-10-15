// Compte limité par l'équipe (services/limitations-comptes-regles.ts) : ce qui se voit des AUTRES utilisateurs est refusé
// (403 « compte-limite »), ce que seule l'équipe lit reste permis. refuserSiLimite se pose APRÈS exigerCompte (il lit
// reponse.locals.compte), juste devant le contrôleur. Sans service de limitations branché, il laisse tout passer.
// La partie sociale de l'app répond avec repondreCompteLimite, pour un refus de la même forme partout.
import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { LimitationActive, ServicesLimitations } from "../services/limitations-comptes-regles.ts";
import type { CompteSession } from "./proteger-comptes.ts";

/**
 * 403 { ok: false, erreur: "compte-limite", details: { jusqua } } : jusqua en ISO 8601, ou null (jusqu'à nouvel ordre).
 * Le motif n'est pas répété ici : GET /comptes/moi/limitation le donne, avec le pourquoi.
 */
export function repondreCompteLimite(reponse: Response, limitation: LimitationActive) {
  return reponse.status(403).json({ ok: false, erreur: "compte-limite", details: { jusqua: limitation.jusqua?.toISOString() ?? null } });
}

/** Le middleware des routes qui écrivent ce que d'autres voient */
export function creerRefuserSiLimite(estLimite: ServicesLimitations["estLimite"] | undefined, horloge: () => number = Date.now): RequestHandler {
  return async function refuserSiLimite(_requete: Request, reponse: Response, suite: NextFunction) {
    if (!estLimite) return suite();
    const limitation = await estLimite((reponse.locals.compte as CompteSession).id, new Date(horloge()));
    if (limitation) return void repondreCompteLimite(reponse, limitation);
    suite();
  };
}
