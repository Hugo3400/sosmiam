// Assemble l'API Express. Les dépendances (base de données…) sont passées en paramètre pour pouvoir tester sans base.
import express from "express";

import { gererErreurs } from "./middlewares/gerer-erreurs.ts";
import { PREFIXE_GESTION } from "./middlewares/proteger-gestion.ts";
import { creerRoutesGestion, type DependancesGestion } from "./routes/gestion.ts";
import { creerRoutesBot } from "./routes/bot.ts";
import { creerRoutesDemandesLieux } from "./routes/demandes-lieux.ts";
import { creerRoutesInscriptions } from "./routes/inscriptions.ts";
import { creerRoutesLieuxPublics } from "./routes/lieux-publics.ts";
import { creerRoutesLocalisation } from "./routes/localisation.ts";
import { creerRoutesMesure } from "./routes/mesure.ts";
import { creerRoutesSignalements } from "./routes/signalements.ts";
import type { NouvelleDemandeLieu } from "./services/demandes-lieux.ts";
import type { SignalementRecu } from "./services/gestion/moderation.ts";
import type { NouvelleInscription } from "./services/inscriptions.ts";
import type { LieuPublic } from "./services/lieux-publics.ts";
import type { Commune } from "./services/localisation.ts";
import type { Vue } from "./services/mesure.ts";

type Dependances = {
  enregistrerInscription: (inscription: NouvelleInscription) => Promise<void>;
  /** Statistiques de visite (route absente si non fournie) */
  enregistrerVue?: (vue: Vue) => Promise<void>;
  /** Clics des boutons de la page /liens */
  enregistrerClic?: (cible: string) => Promise<void>;
  enregistrerSignalement?: (signalement: SignalementRecu) => Promise<void>;
  /** Commune qui contient une position, pour le bouton « Me localiser » du formulaire (route absente si non fournie) */
  trouverCommune?: (latitude: number, longitude: number) => Promise<Commune | null>;
  /** Lieux publiés, pour l'accueil du site (route absente si non fournie) */
  listerLieuxPublics?: () => Promise<LieuPublic[]>;
  /** Un lieu qui demande à être sur SOS Miam, depuis le site (route absente si non fournie) */
  enregistrerDemandeLieu?: (demande: NouvelleDemandeLieu) => Promise<void>;
  /** Bot Discord : propositions de lieux et annonces à publier (routes absentes si non fourni) */
  bot?: Parameters<typeof creerRoutesBot>[0];
  /** Logiciel de gestion (routes absentes si non fourni) */
  gestion?: DependancesGestion;
};

export function creerApplication({
  enregistrerInscription, enregistrerVue, enregistrerClic, enregistrerSignalement, trouverCommune, listerLieuxPublics, enregistrerDemandeLieu, bot, gestion,
}: Dependances) {
  const application = express();
  application.disable("x-powered-by");
  // Avant le lecteur JSON : la gestion lit le corps brut, sur lequel porte la signature
  if (gestion) application.use(PREFIXE_GESTION, creerRoutesGestion(gestion));
  application.use(express.json({ limit: "4kb" }));

  application.get("/sante", (_requete, reponse) => {
    reponse.json({ ok: true });
  });
  application.use("/inscriptions", creerRoutesInscriptions(enregistrerInscription));
  if (trouverCommune) application.use("/localisation", creerRoutesLocalisation(trouverCommune));
  if (listerLieuxPublics) application.use("/lieux", creerRoutesLieuxPublics(listerLieuxPublics));
  if (enregistrerDemandeLieu) application.use("/demandes-lieux", creerRoutesDemandesLieux(enregistrerDemandeLieu));
  if (bot) application.use("/bot", creerRoutesBot(bot));
  if (enregistrerVue) application.use("/mesure", creerRoutesMesure(enregistrerVue, enregistrerClic));
  if (enregistrerSignalement) application.use("/signalements", creerRoutesSignalements(enregistrerSignalement));

  application.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  application.use(gererErreurs);
  return application;
}
