import type { Request, Response } from "express";

import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import type { ActusCommentaires } from "../services/actus-commentaires.ts";
import { repondreEchecActus } from "./actus.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";

export function creerControleursActusCommentaires(commentaires: ActusCommentaires) {
  return {
    async lister(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const apresBrut = requete.query.apres;
      const apres = apresBrut === undefined ? null : lireIdentifiant(apresBrut);
      if (apresBrut !== undefined && apres === null) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "apres" });
      const compteId = (reponse.locals.compte as CompteSession | undefined)?.id ?? null;
      const page = id ? await commentaires.lister(id, { apres, avecAlcool: compteId !== null, compteId }) : null;
      if (!page) return reponse.status(404).json({ ok: false, erreur: "article-introuvable" });
      reponse.set("Cache-Control", "private, no-store").json({ ok: true, ...page });
    },

    async commenter(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      if (!id) return reponse.status(404).json({ ok: false, erreur: "article-introuvable" });
      const corps = lireCorps(requete);
      const r = await commentaires.commenter(lireCompteId(reponse), id, corps.texte, corps.reponseA);
      if (!r.ok) return repondreEchecActus(reponse, r);
      reponse.status(201).json({ ok: true, commentaire: r.commentaire });
    },

    async supprimer(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.commentaireId);
      const r = id ? await commentaires.supprimer(lireCompteId(reponse), id) : null;
      if (!r || !r.ok) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      reponse.json({ ok: true });
    },
  };
}
