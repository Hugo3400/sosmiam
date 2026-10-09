// Le rôle pro (espace pro, rattachements, comptoir de Miam Safe) est réservé aux 18 ans et plus, côté serveur, pas
// seulement caché dans le compte rendu (docs/decisions.md, « Espace pro » et « Comptes et données de l'app »).
// Après exigerCompte : 403 « reserve-aux-majeurs » si l'âge connu est sous 18 ans (même code que les propositions de
// lieux) ; 503 « chiffrement-indisponible » si la date gardée ne peut pas se lire ; un compte sans date (compte du site,
// qui a prouvé 18 ans) passe ; 401 « session-expiree » si le compte n'existe plus.
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { lireMajoriteCompte } from "../fonctions/comptes/lire-majorite-compte.ts";
import type { ChiffrementDonnees } from "../services/chiffrement-donnees.ts";
import type { CompteSession } from "./proteger-comptes.ts";

/** Ce que la protection lit du compte (ServicesComptes.lireCompte convient) */
export type LireDateNaissance = (compteId: number) => Promise<{ dateNaissanceChiffree: string | null } | null>;

export function creerExigenceMajeur(lireCompte: LireDateNaissance, chiffrement: ChiffrementDonnees | null, horloge: () => number = Date.now): RequestHandler {
  return async (_requete: Request, reponse: Response, suite: NextFunction) => {
    const compte = await lireCompte((reponse.locals.compte as CompteSession).id);
    if (!compte) return void reponse.status(401).json({ ok: false, erreur: "session-expiree" });
    const majorite = lireMajoriteCompte(compte.dateNaissanceChiffree, chiffrement, new Date(horloge()));
    if (majorite === "majeur") return suite();
    if (majorite === "illisible") return void reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });
    reponse.status(403).json({ ok: false, erreur: "reserve-aux-majeurs" });
  };
}
