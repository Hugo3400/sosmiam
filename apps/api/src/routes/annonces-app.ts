import { Router, type Request, type Response } from "express";

import type { AnnonceApp } from "../../../../packages/commun/src/types/annonce-app.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { CompteSession, ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { sessionFacultative } from "../middlewares/session-facultative.ts";

export type DependancesAnnoncesApp = {
  lister: (filtres: { ville: string; compteId: number | null }) => Promise<AnnonceApp[]>;
};

export const LIMITE_ANNONCES_APP = { fenetre: 60_000, maximum: 60 };

export function creerRoutesAnnoncesApp(d: DependancesAnnoncesApp, protection: ProtectionComptes) {
  const routes = Router();
  routes.use(limiterRequetes(LIMITE_ANNONCES_APP), (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  routes.get("/", sessionFacultative(protection), async (requete: Request, reponse: Response) => {
    const ville = typeof requete.query.ville === "string" ? requete.query.ville.trim().slice(0, 80) : "";
    const compte = reponse.locals.compte as CompteSession | undefined;
    reponse.json({ ok: true, annonces: await d.lister({ ville, compteId: compte?.id ?? null }) });
  });
  return routes;
}
