// Assemble l'API Express. Les dépendances (base de données…) sont passées en paramètre pour pouvoir tester sans base.
import express from "express";

import { gererErreurs } from "./middlewares/gerer-erreurs.ts";
import { creerLimiteConnectes } from "./middlewares/limiter-connectes.ts";
import { creerControleMajorite } from "./middlewares/exiger-majeur.ts";
import { creerProtectionComptes, gererErreursComptes } from "./middlewares/proteger-comptes.ts";
import { PREFIXE_GESTION } from "./middlewares/proteger-gestion.ts";
import { creerRoutesGestion, type DependancesGestion } from "./routes/gestion.ts";
import { creerRoutesApp } from "./routes/app.ts";
import { creerRoutesContenuApp } from "./routes/contenu-app.ts";
import { creerRoutesActivite } from "./routes/activite.ts";
import type { DependancesActivite } from "./controleurs/activite.ts";
import { creerRoutesVisites } from "./routes/visites.ts";
import type { DependancesVisites } from "./controleurs/visites.ts";
import type { DependancesContenuApp } from "./controleurs/contenu-app.ts";
import type { DependancesApp } from "./controleurs/app.ts";
import { creerRoutesBot } from "./routes/bot.ts";
import { creerRoutesComptes, LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP, type DependancesComptes } from "./routes/comptes.ts";
import { creerRoutesDemandesLieux } from "./routes/demandes-lieux.ts";
import { creerRoutesEspaceAmbassadeur, type DependancesEspaceAmbassadeur } from "./routes/espace-ambassadeur.ts";
import { creerRoutesFondateurs } from "./routes/fondateurs.ts";
import { creerRoutesInscriptions } from "./routes/inscriptions.ts";
import { creerRoutesLieuxPublics } from "./routes/lieux-publics.ts";
import { creerRoutesLocalisation } from "./routes/localisation.ts";
import { creerRoutesMesure } from "./routes/mesure.ts";
import { creerRoutesMiamSafe } from "./routes/miam-safe.ts";
import type { DependancesMiamSafe } from "./controleurs/miam-safe.ts";
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
  /** Miam Safe : alertes silencieuses, signalements, « Tu t'es senti·e bien ici ? », charte (routes /miam-safe, seulement avec
   * `comptes` et `comptes.pro`) */
  miamSafe?: DependancesMiamSafe;
  /** L'app, sans session : heure du serveur et version minimale (routes /app ; absentes si non fourni) */
  app?: DependancesApp;
  /** L'app, sans session : lieux publiés, leur carte, le fil « Pour toi » et ses médias (routes /app/lieux, /app/publications,
   * /app/medias ; absentes si non fourni). Monté avant `app` : sa limite générale ne compte pas les médias */
  contenuApp?: DependancesContenuApp;
  /** L'app, avec session : rescousses, lieux gardés, J'aime, masques et suivis (routes /app/activite ; seulement avec `comptes`) */
  activiteApp?: DependancesActivite;
  /** L'app, avec session : visites, fidélité (routes /app/visites, /app/fidelite) et comptoir de l'équipe (routes
   * /pro/comptoir, montées avant /pro) ; seulement avec `comptes` */
  visitesApp?: DependancesVisites;
};

/** Espace ambassadeur : données personnelles, jamais gardées dans un cache */
const PREFIXES_COMPTES = ["/comptes", "/espace-ambassadeur", "/pro", "/miam-safe"];
const interdireCache: express.RequestHandler = (_requete, reponse, suite) => {
  reponse.set("Cache-Control", "private, no-store");
  suite();
};

export function creerApplication({
  enregistrerInscription, enregistrerVue, enregistrerClic, enregistrerSignalement, trouverCommune, listerLieuxPublics, lireFichePublique,
  enregistrerDemandeLieu, bot, gestion,
  comptes, espaceAmbassadeur, zones, miamSafe,
  app, contenuApp, activiteApp, visitesApp,
}: Dependances) {
  const application = express();
  application.disable("x-powered-by");
  // Avant le lecteur JSON : la gestion lit le corps brut, sur lequel porte la signature
  if (gestion) application.use(PREFIXE_GESTION, creerRoutesGestion(gestion));
  // Les textes de l'espace ambassadeur sont plus longs (candidature, compte rendu de mission : jusqu'à 2 000 caractères,
  // accents et emojis compris) : leur propre lecteur JSON, un peu plus large ; le lecteur suivant voit le corps déjà lu
  // La carte d'un lieu (PUT /pro/lieux/:id/carte) : jusqu'à 250 plats avec leur description, donc son propre lecteur
  if (comptes?.pro) application.put("/pro/lieux/:id/carte", interdireCache, express.json({ limit: "300kb" }));
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
    const limiteConnectee = creerLimiteConnectes(LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP);
    application.use("/comptes", creerRoutesComptes(comptes, protection, limiteConnectee));
    // Visites, fidélité et comptoir (même compte, même session) : le comptoir avant le routeur /pro de l'espace pro
    if (visitesApp) {
      const routesVisites = creerRoutesVisites(visitesApp, protection, limiteConnectee, comptes.horloge ?? Date.now);
      application.use("/app/visites", routesVisites.visites);
      application.use("/app/fidelite", routesVisites.fidelite);
      application.use("/pro/comptoir", routesVisites.comptoir);
    }
    // Espace pro (pro.sosmiam.fr) : même compte, même session
    // Rôle pro (espace pro, comptoir de Miam Safe) : réservé aux 18 ans et plus, vérifié à chaque demande
    const majorite = creerControleMajorite(comptes.services.lireCompte, comptes.chiffrement ?? null, comptes.horloge);
    if (comptes.pro) application.use("/pro", creerRoutesPro(comptes.pro, protection, limiteConnectee, comptes.horloge, majorite));
    // Miam Safe : même compte, même session ; le comptoir du lieu passe par les rattachements de l'espace pro
    if (comptes.pro && miamSafe) application.use("/miam-safe", creerRoutesMiamSafe(miamSafe, comptes.pro, protection, limiteConnectee, comptes.horloge, majorite.exigerMajeur));
    // L'activité de l'app (même compte, même session), avant le routeur /app de l'heure et de la version
    if (activiteApp) application.use("/app/activite", creerRoutesActivite(activiteApp, protection, limiteConnectee, comptes.horloge ?? Date.now));
    if (espaceAmbassadeur) {
      application.use(
        "/espace-ambassadeur",
        limiteConnectee, protection.exigerAmbassadeurActif, creerRoutesEspaceAmbassadeur(espaceAmbassadeur), gererErreursComptes,
      );
    }
  }

  // L'app, sans session : heure du serveur et version minimale
  // Lieux, fil et médias de l'app : avant le routeur suivant, qui limite toutes les adresses /app (ce que celui-ci ne
  // connaît pas lui passe)
  if (contenuApp) application.use("/app", creerRoutesContenuApp(contenuApp));
  if (app) application.use("/app", creerRoutesApp(app));

  application.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  application.use(gererErreurs);
  return application;
}
