// Les avis au comptoir (voir routes/comptoir.ts) : la liste des avis du lieu pour son équipe, et la réponse publique du
// gérant (une par avis, 600 caractères, filtre de mots). Le rôle est revérifié à chaque geste (roleDe : rattachement validé
// et 18 ans), sur le lieu de l'avis.
import type { Request, Response } from "express";

import { validerReponseAvis } from "../../../../packages/commun/src/validation/valider-reponse-avis.ts";
import { lireCurseurAvis } from "../fonctions/avis/lire-curseur-avis.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import { creerAvisPro, type RoleDe } from "../services/avis-pro.ts";
import type { ContexteAvis } from "../services/avis-regles.ts";
import { repondreEchecAvis } from "./avis.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide } from "./visites.ts";

export function creerControleursAvisPro(services: Pick<ContexteAvis, "depot">, roleDe: RoleDe, horloge: () => number) {
  const pro = creerAvisPro({ depot: services.depot, horloge }, roleDe);

  return {
    /** GET /pro/comptoir/lieux/:id/avis[?apres=] */
    async lister(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.id);
      if (lieuId === null) return champInvalide(reponse, "id");
      const apres = lireCurseurAvis(requete.query.apres);
      if (apres === undefined) return champInvalide(reponse, "apres");
      const r = await pro.lister(lireCompteId(reponse), lieuId, apres);
      if (!r.ok) return repondreEchecAvis(reponse, r);
      reponse.json(r);
    },

    /** POST /pro/comptoir/avis/:avisId/reponse { texte } */
    async repondre(requete: Request, reponse: Response) {
      const avisId = lireIdentifiant(requete.params.avisId);
      if (avisId === null) return champInvalide(reponse, "avisId");
      const texte = lireCorps(requete).texte;
      const refus = validerReponseAvis(texte as string);
      if (refus) return reponse.status(400).json({ ok: false, erreur: refus, champ: "texte" });
      const r = await pro.repondre(lireCompteId(reponse), avisId, texte as string);
      if (!r.ok) return repondreEchecAvis(reponse, r);
      reponse.status(201).json(r);
    },
  };
}
