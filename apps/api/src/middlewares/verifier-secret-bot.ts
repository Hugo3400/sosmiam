import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Routes réservées au bot Discord (/bot/…) : il envoie le secret partagé SECRET_BOT (présent dans apps/api/.env et
 * apps/bot-discord/.env). L'API n'écoute qu'en local, mais un autre programme du serveur ne doit pas pouvoir s'en servir.
 */
export function verifierSecretBot(secret = process.env.SECRET_BOT ?? "") {
  return (requete: Request, reponse: Response, suite: NextFunction) => {
    const recu = Buffer.from(requete.get("x-secret-bot") ?? "");
    const attendu = Buffer.from(secret);
    if (secret.length < 32 || recu.length !== attendu.length || !timingSafeEqual(recu, attendu)) {
      return reponse.status(401).json({ ok: false, erreur: "non-autorise" });
    }
    suite();
  };
}
