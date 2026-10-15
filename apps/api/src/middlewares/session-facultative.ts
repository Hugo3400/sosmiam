import type { NextFunction, Request, RequestHandler, Response } from "express";

import { lireJetonSession, type ProtectionComptes } from "./proteger-comptes.ts";

export function sessionFacultative(protection: ProtectionComptes): RequestHandler {
  return (requete: Request, reponse: Response, suite: NextFunction) => {
    if (!lireJetonSession(requete)) return suite();
    let passe = false;
    const continuer = () => {
      if (passe) return;
      passe = true;
      suite();
    };
    const muette = { locals: reponse.locals, status: () => muette, json: () => (continuer(), muette) } as unknown as Response;
    protection.exigerCompte(requete, muette, continuer).catch(continuer);
  };
}
