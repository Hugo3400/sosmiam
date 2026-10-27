import type { Request, Response } from "express";

import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ActusPro } from "../services/actus-pro.ts";
import { repondreEchecActus } from "./actus.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";

export function creerControleursActusPro(actus: ActusPro) {
  return {
    async lister(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.id);
      if (!lieuId) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      const r = await actus.lister(lireCompteId(reponse), lieuId);
      if (!r.ok) return repondreEchecActus(reponse, r);
      reponse.json({ ok: true, articles: r.articles });
    },

    async repondre(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.id);
      const articleId = lireIdentifiant(requete.params.articleId);
      if (!lieuId || !articleId) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      const r = await actus.repondre(lireCompteId(reponse), lieuId, articleId, lireCorps(requete).texte);
      if (!r.ok) return repondreEchecActus(reponse, r);
      reponse.status(201).json({ ok: true });
    },
  };
}
