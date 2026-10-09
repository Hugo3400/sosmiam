// Assemble l'API Express. Les dépendances (base de données…) sont passées en paramètre pour pouvoir tester sans base.
import express from "express";

import { gererErreurs } from "./middlewares/gerer-erreurs.ts";
import { limiterRequetes } from "./middlewares/limiter-requetes.ts";
import { creerProtectionComptes, gererErreursComptes } from "./middlewares/proteger-comptes.ts";
import { PREFIXE_GESTION } from "./middlewares/proteger-gestion.ts";
import { creerRoutesGestion, type DependancesGestion } from "./routes/gestion.ts";
import { creerRoutesBot } from "./routes/bot.ts";
import { creerRoutesComptes, LIMITE_CONNECTEE, type DependancesComptes } from "./routes/comptes.ts";
import { creerRoutesDemandesLieux } from "./routes/demandes-lieux.ts";
import { creerRoutesEspaceAmbassadeur, type DependancesEspaceAmbassadeur } from "./routes/espace-ambassadeur.ts";
import { creerRoutesFondateurs } from "./routes/fondateurs.ts";
import { creerRoutesInscriptions } from "./routes/inscriptions.ts";
import { creerRoutesLieuxPublics } from "./routes/lieux-publics.ts";
import { creerRoutesLocalisation } from "./routes/localisation.ts";
import { creerRoutesMesure } from "./routes/mesure.ts";
import { creerRoutesPro } from "./routes/pro.ts";
import { creerRoutesSignalements } from "./routes/signalements.ts";
import type { NouvelleDemandeLieu } from "./services/demandes-lieux.ts";
import type { SignalementRecu } from "./services/gestion/moderation.ts";
import type { NouvelleInscription } from "./services/inscriptions.ts";
import type { FichePublique, LieuPublic } from "./services/lieux-publics.ts";
import type { Commune } from "./services/localisation.ts";
import type { Vue } from "./services/mesure.ts";
import type { ServicesZones } from "./services/zones-fondateurs.ts";

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
  /** Fiche publique d'un lieu publié, pour sa page sur le site (GET /lieux/publics/:id ; absente si non fournie) */
  lireFichePublique?: (id: number) => Promise<FichePublique | null>;
  /** Un lieu qui demande à être sur SOS Miam, depuis le site (route absente si non fournie) */
  enregistrerDemandeLieu?: (demande: NouvelleDemandeLieu) => Promise<void>;
  /** Bot Discord : propositions de lieux et annonces à publier (routes absentes si non fourni) */
  bot?: Parameters<typeof creerRoutesBot>[0];
  /** Logiciel de gestion (routes absentes si non fourni) */
  gestion?: DependancesGestion;
  /** Comptes de l'espace ambassadeur : inscription, connexion, « Mon compte »… (routes /comptes absentes si non fourni) */
  comptes?: DependancesComptes;
  /** « Mes missions » et « Mes messages » de l'espace ambassadeur (routes /espace-ambassadeur, seulement avec `comptes`) */
  espaceAmbassadeur?: DependancesEspaceAmbassadeur;
  /** Zones des fondateurs : routes publiques /communes et /fondateurs (absentes si non fourni) */
  zones?: ServicesZones;
};

/** Espace ambassadeur : données personnelles, jamais gardées dans un cache */
const PREFIXES_COMPTES = ["/comptes", "/espace-ambassadeur", "/pro"];
const interdireCache: express.RequestHandler = (_requete, reponse, suite) => {
  reponse.set("Cache-Control", "private, no-store");
  suite();
};

export function creerApplication({
  enregistrerInscription, enregistrerVue, enregistrerClic, enregistrerSignalement, trouverCommune, listerLieuxPublics, lireFichePublique,
  enregistrerDemandeLieu, bot, gestion,
  comptes, espaceAmbassadeur, zones,
}: Dependances) {
  const application = express();
  application.disable("x-powered-by");
  // Avant le lecteur JSON : la gestion lit le corps brut, sur lequel porte la signature
  if (gestion) application.use(PREFIXE_GESTION, creerRoutesGestion(gestion));
  // Les textes de l'espace ambassadeur sont plus longs (candidature, compte rendu de mission : jusqu'à 2 000 caractères,
  // accents et emojis compris) : leur propre lecteur JSON, un peu plus large ; le lecteur suivant voit le corps déjà lu
  if (comptes) application.use(PREFIXES_COMPTES, interdireCache, express.json({ limit: "16kb" }));
  application.use(express.json({ limit: "4kb" }));

  application.get("/sante", (_requete, reponse) => {
    reponse.json({ ok: true });
  });
  application.use("/inscriptions", creerRoutesInscriptions(enregistrerInscription));
  if (trouverCommune) application.use("/localisation", creerRoutesLocalisation(trouverCommune));
  if (listerLieuxPublics || lireFichePublique) application.use("/lieux", creerRoutesLieuxPublics(listerLieuxPublics, lireFichePublique));
  if (enregistrerDemandeLieu) application.use("/demandes-lieux", creerRoutesDemandesLieux(enregistrerDemandeLieu));
  if (bot) application.use("/bot", creerRoutesBot(bot));
  if (enregistrerVue) application.use("/mesure", creerRoutesMesure(enregistrerVue, enregistrerClic));
  if (enregistrerSignalement) application.use("/signalements", creerRoutesSignalements(enregistrerSignalement));
  // Sans session : recherche de commune et places de fondateurs (GET /communes, /fondateurs/zone, /fondateurs/zones)
  if (zones) application.use(creerRoutesFondateurs(zones));
  if (comptes) {
    // Une seule protection (sessions) et une seule limite « connecté » pour /comptes et /espace-ambassadeur
    const protection = creerProtectionComptes(comptes.sessions, comptes.horloge);
    const limiteConnectee = limiterRequetes(LIMITE_CONNECTEE);
    application.use("/comptes", creerRoutesComptes(comptes, protection, limiteConnectee));
    // Espace pro (pro.sosmiam.fr) : même compte, même session
    if (comptes.pro) application.use("/pro", creerRoutesPro(comptes.pro, protection, limiteConnectee, comptes.horloge));
    if (espaceAmbassadeur) {
      application.use(
        "/espace-ambassadeur",
        limiteConnectee, protection.exigerAmbassadeurActif, creerRoutesEspaceAmbassadeur(espaceAmbassadeur), gererErreursComptes,
      );
    }
  }

  application.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  application.use(gererErreurs);
  return application;
}
