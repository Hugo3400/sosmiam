// Assemble l'API Express. Les dépendances (base de données…) sont passées en paramètre pour pouvoir tester sans base.
import express from "express";

import { gererErreurs } from "./middlewares/gerer-erreurs.ts";
import { PREFIXE_GESTION } from "./middlewares/proteger-gestion.ts";
import { creerRoutesGestion, type DependancesGestion } from "./routes/gestion.ts";
import { creerRoutesInscriptions } from "./routes/inscriptions.ts";
import { creerRoutesMesure } from "./routes/mesure.ts";
import { creerRoutesSignalements } from "./routes/signalements.ts";
import type { SignalementRecu } from "./services/gestion/moderation.ts";
import type { NouvelleInscription } from "./services/inscriptions.ts";
import type { Vue } from "./services/mesure.ts";

type Dependances = {
  enregistrerInscription: (inscription: NouvelleInscription) => Promise<void>;
  /** Statistiques de visite (route absente si non fournie) */
  enregistrerVue?: (vue: Vue) => Promise<void>;
  enregistrerSignalement?: (signalement: SignalementRecu) => Promise<void>;
  /** Logiciel de gestion (routes absentes si non fourni) */
  gestion?: DependancesGestion;
};

export function creerApplication({ enregistrerInscription, enregistrerVue, enregistrerSignalement, gestion }: Dependances) {
  const application = express();
  application.disable("x-powered-by");
  // Avant le lecteur JSON : la gestion lit le corps brut, sur lequel porte la signature
  if (gestion) application.use(PREFIXE_GESTION, creerRoutesGestion(gestion));
  application.use(express.json({ limit: "4kb" }));

  application.get("/sante", (_requete, reponse) => {
    reponse.json({ ok: true });
  });
  application.use("/inscriptions", creerRoutesInscriptions(enregistrerInscription));
  if (enregistrerVue) application.use("/mesure", creerRoutesMesure(enregistrerVue));
  if (enregistrerSignalement) application.use("/signalements", creerRoutesSignalements(enregistrerSignalement));

  application.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  application.use(gererErreurs);
  return application;
}
