// Assemble l'API Express. Les dépendances (base de données…) sont passées en paramètre pour pouvoir tester sans base.
import express from "express";

import { gererErreurs } from "./middlewares/gerer-erreurs.ts";
import { creerRoutesInscriptions } from "./routes/inscriptions.ts";
import type { NouvelleInscription } from "./services/inscriptions.ts";

type Dependances = {
  enregistrerInscription: (inscription: NouvelleInscription) => Promise<void>;
};

export function creerApplication({ enregistrerInscription }: Dependances) {
  const application = express();
  application.disable("x-powered-by");
  application.use(express.json({ limit: "4kb" }));

  application.get("/sante", (_requete, reponse) => {
    reponse.json({ ok: true });
  });
  application.use("/inscriptions", creerRoutesInscriptions(enregistrerInscription));

  application.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  application.use(gererErreurs);
  return application;
}
