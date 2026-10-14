// Les défis de l'app, pour le compte connecté (voir routes/defis.ts). La réévaluation (points crédités ou repris, badges
// automatiques) se fait dans le service, avant de lire.
import type { Request, Response } from "express";

import { lireCompteId } from "./comptes-champs.ts";
import type { ServicesDefis } from "../services/defis-regles.ts";

export type DependancesDefisApp = {
  /** Services de services/defis.ts (le double defis-en-memoire.ts dans les tests) */
  services: ServicesDefis;
};

export function creerControleursDefis({ services }: DependancesDefisApp, horloge: () => number) {
  return {
    /** GET /app/defis */
    async lister(_requete: Request, reponse: Response) {
      const defis = await services.listerPourCompte(lireCompteId(reponse), new Date(horloge()));
      reponse.json({ ok: true, defis });
    },
  };
}
