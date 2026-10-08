import express, { Router } from "express";

import { creerControleursGestion } from "../controleurs/gestion/controleurs-gestion.ts";
import { autoriserOriginesGestion } from "../middlewares/autoriser-origines-gestion.ts";
import { creerProtectionGestion } from "../middlewares/proteger-gestion.ts";
import type { AccesGestion } from "../services/gestion/acces.ts";
import { TAILLE_MAX_VIDEO } from "../services/gestion/formats-medias.ts";
import type { ServicesGestion } from "../services/gestion/tous-les-services.ts";

export type DependancesGestion = {
  lireAcces: () => AccesGestion | null;
  services: ServicesGestion;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
};

/** /api-gestion/… : les routes du logiciel de gestion, toutes signées par un poste autorisé (voir proteger-gestion.ts). */
export function creerRoutesGestion({ lireAcces, services, horloge }: DependancesGestion) {
  const protection = creerProtectionGestion(lireAcces, horloge);
  const c = creerControleursGestion(services);
  const routes = Router();
  routes.use(autoriserOriginesGestion());
  // Rien de la gestion ne doit rester dans un cache (Cloudflare garde sinon les .jpg et .mp4 par défaut)
  routes.use((_requete, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  routes.use(protection.controlerEnTetes);
  // Corps lu tel quel (la signature porte sur ses octets exacts), seulement une fois les en-têtes contrôlés
  routes.use(express.raw({ type: () => true, limit: TAILLE_MAX_VIDEO + 1024 }));
  routes.use(protection.verifierSignature);
  routes.post("/session", protection.ouvrirSession);
  routes.use(protection.verifierSession);
  routes.delete("/session", protection.fermerSession);

  routes.get("/tableau-de-bord", c.tableauDeBord);
  routes.get("/statistiques", c.statistiques);
  routes.get("/journal", c.journal);

  routes.get("/newsletter/inscrits", c.inscrits);
  routes.delete("/newsletter/inscrits/:id", c.desinscrire);
  routes.get("/newsletter/export", c.exporter);
  routes.get("/newsletter/brouillons", c.brouillons);
  routes.post("/newsletter/brouillons", c.enregistrerBrouillon);
  routes.get("/newsletter/brouillons/:id", c.brouillon);
  routes.put("/newsletter/brouillons/:id", c.enregistrerBrouillon);
  routes.delete("/newsletter/brouillons/:id", c.supprimerBrouillon);

  routes.get("/lieux", c.lieux);
  routes.post("/lieux", c.enregistrerLieu);
  routes.get("/lieux/:id", c.lieu);
  routes.put("/lieux/:id", c.enregistrerLieu);
  routes.delete("/lieux/:id", c.supprimerLieu);

  routes.get("/publications", c.publications);
  routes.post("/publications", c.enregistrerPublication);
  routes.get("/publications/:id", c.publication);
  routes.put("/publications/:id", c.enregistrerPublication);
  routes.delete("/publications/:id", c.supprimerPublication);
  routes.post("/publications/:id/medias", c.ajouterMedia);
  routes.delete("/publications/:id/medias/:idMedia", c.retirerMedia);
  routes.get("/medias/:fichier", c.media);

  routes.get("/moderation", c.signalements);
  routes.post("/moderation/:id/decision", c.deciderSignalement);

  routes.get("/maintenance", c.maintenance);
  routes.post("/maintenance/relancer", c.relancer);

  routes.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  return routes;
}
