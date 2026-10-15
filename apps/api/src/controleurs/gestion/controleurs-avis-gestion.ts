// Contrôleurs de la relecture des avis dans le logiciel de gestion : la file (lecture seule). Trancher arrive avec le
// service de la session App (avis-gestion.ts).
import type { Request, Response } from "express";

import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

export function creerControleursAvisGestion(s: ServicesGestion) {
  return {
    /** GET /avis/a-relire?quoi=avis|reponses&page= */
    aRelire: async (requete: Request, reponse: Response) => {
      reponse.json(await s.listerAvisARelire({
        quoi: requete.query.quoi === "reponses" ? "reponses" : "avis",
        page: Math.min(1000, Math.max(1, Math.floor(Number(requete.query.page)) || 1)),
      }));
    },
  };
}
