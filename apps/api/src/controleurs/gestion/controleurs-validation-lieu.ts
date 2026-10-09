// Contrôleurs de la validation des visites d'un lieu dans le logiciel de gestion : lire, régler (active, rayon) et changer
// le code du QR de vitrine. Journal : « lieu n° X », jamais le code lui-même.
import type { Request, Response } from "express";

import { RAYON_VALIDATION_MAX_M, RAYON_VALIDATION_MIN_M } from "../../../../../packages/commun/src/regles/visites.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireId, lireNombre } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

function verifier(controleur: (requete: Request, reponse: Response) => Promise<unknown>) {
  return async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
}

export function creerControleursValidationLieu(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    /** GET /lieux/:id/validation */
    lire: verifier(async (requete, reponse) => {
      const validation = await s.lireValidationLieu(id(requete));
      return validation ? reponse.json(validation) : introuvable(reponse);
    }),

    /** PUT /lieux/:id/validation : { validationActive: boolean, rayonM: nombre entier de 100 à 500, ou null pour 200 m } */
    regler: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      if (typeof corps.validationActive !== "boolean") throw new ChampInvalide("validationActive");
      const rayonM = lireNombre(corps, "rayonM", RAYON_VALIDATION_MIN_M, RAYON_VALIDATION_MAX_M);
      const validation = await s.reglerValidationLieu(id(requete), { validationActive: corps.validationActive, rayonM });
      if (!validation) return introuvable(reponse);
      const rayon = rayonM === null ? "rayon par défaut" : `rayon ${rayonM} m`;
      await noter(reponse, corps.validationActive ? "Validation des visites activée" : "Validation des visites coupée", `lieu n° ${id(requete)}, ${rayon}`);
      reponse.json({ ok: true, validation });
    }),

    /** POST /lieux/:id/validation/code : un nouveau code de vitrine (l'ancien QR ne marche plus) */
    changerCode: verifier(async (requete, reponse) => {
      const validation = await s.changerCodePublic(id(requete));
      if (!validation) return introuvable(reponse);
      await noter(reponse, "Code du QR de vitrine changé (l'ancien ne marche plus)", `lieu n° ${id(requete)}`);
      reponse.json({ ok: true, validation });
    }),
  };
}
