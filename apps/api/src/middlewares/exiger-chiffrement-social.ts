// Routes sociales 🔐 (messages, titres de groupes, médias, codes d'invitation, signalements de contenus sociaux) : elles ont
// besoin de la clé des données (services/chiffrement-social.ts). Sans elle (fichier absent ou mal protégé au démarrage),
// 503 « chiffrement-indisponible » (« Coffre-fort fermé »), avant de lire quoi que ce soit ; le reste de l'API marche.
import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { ChiffrementSocial } from "../services/chiffrement-social.ts";

export function exigerChiffrementSocial(chiffrement: ChiffrementSocial | null): RequestHandler {
  return (_requete: Request, reponse: Response, suite: NextFunction) => {
    if (chiffrement) return suite();
    reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });
  };
}
