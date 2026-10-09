// Limite « connecté » des routes des comptes (/comptes, /pro, /app/activite, /app/visites, /miam-safe, l'espace
// ambassadeur). Comptée PAR SESSION : derrière un opérateur mobile (CGNAT) ou le Wi-Fi d'un resto, des centaines de
// téléphones partagent une même IP, et l'addition suivie toutes les 4 s ou le comptoir toutes les 5 s l'épuiseraient.
// Une limite par IP, bien plus large, reste devant : elle arrête un robot qui changerait de jeton à chaque appel.
import { createHash } from "node:crypto";

import type { NextFunction, Request, RequestHandler, Response } from "express";

import { limiterRequetes } from "./limiter-requetes.ts";
import { lireJetonSession } from "./proteger-comptes.ts";

type Reglages = { fenetre: number; maximum: number };

/** Par session (ou par IP s'il n'y a pas de jeton), puis par IP avec la limite large. */
export function creerLimiteConnectes(parSession: Reglages, parIp: Reglages): RequestHandler {
  const limiteIp = limiterRequetes(parIp);
  const limiteSession = limiterRequetes({
    ...parSession,
    // L'empreinte du jeton, jamais le jeton lui-même ; sans jeton, la clé par défaut (l'IP) s'applique dans limiterRequetes
    cle: (requete) => {
      const jeton = lireJetonSession(requete);
      return jeton ? `session:${createHash("sha256").update(jeton).digest("hex").slice(0, 32)}` : `ip:${requete.get("x-ip-visiteur") ?? requete.socket.remoteAddress ?? "inconnu"}`;
    },
  });
  return (requete: Request, reponse: Response, suite: NextFunction) => {
    limiteIp(requete, reponse, (erreur?: unknown) => (erreur ? suite(erreur) : limiteSession(requete, reponse, suite)));
  };
}
