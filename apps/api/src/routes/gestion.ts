import express, { Router } from "express";

import { creerControleursGestion } from "../controleurs/gestion/controleurs-gestion.ts";
import { autoriserOriginesGestion } from "../middlewares/autoriser-origines-gestion.ts";
import { creerProtectionGestion, type StockageSessions } from "../middlewares/proteger-gestion.ts";
import type { AccesGestion } from "../services/gestion/acces.ts";
import { TAILLE_MAX_VIDEO } from "../services/gestion/formats-medias.ts";
import { creerJetonMaj, lireManifesteMaj, trouverInstallateur, verifierJetonMaj } from "../services/gestion/mises-a-jour.ts";
import type { ServicesGestion } from "../services/gestion/tous-les-services.ts";

export type DependancesGestion = {
  lireAcces: () => AccesGestion | null;
  services: ServicesGestion;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
  /** Où garder les sessions (la base en vrai ; en mémoire si absent) */
  sessions?: StockageSessions;
  /** « En ce moment » : visites actives et pages regardées (compteur de visites de l'API) */
  lireDirect?: (source: "site" | "app") => { visites: number; pages: { valeur: string; nombre: number }[] };
};

/** /api-gestion/… : les routes du logiciel de gestion, toutes signées par un poste autorisé (voir proteger-gestion.ts). */
export function creerRoutesGestion({ lireAcces, services, horloge, sessions, lireDirect }: DependancesGestion) {
  const protection = creerProtectionGestion(lireAcces, horloge, sessions);
  const c = creerControleursGestion(services);
  const routes = Router();
  routes.use(autoriserOriginesGestion());
  // Rien de la gestion ne doit rester dans un cache (Cloudflare garde sinon les .jpg et .mp4 par défaut)
  routes.use((_requete, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  // Mises à jour du logiciel : demandées par le module de mise à jour de Tauri, avec le jeton obtenu par /maj/jeton
  const jetonValable: express.RequestHandler = (requete, reponse, suite) =>
    verifierJetonMaj(requete.get("x-jeton-maj") ?? "") ? suite() : void reponse.status(401).json({ ok: false, erreur: "non-autorise" });
  routes.get("/maj/latest.json", jetonValable, async (_requete, reponse) => {
    const manifeste = await lireManifesteMaj();
    // 204 : pas de mise à jour disponible (le module de Tauri le comprend ainsi)
    if (!manifeste) return void reponse.status(204).end();
    reponse.type("application/json").send(manifeste);
  });
  routes.get("/maj/fichiers/:nom", jetonValable, async (requete, reponse) => {
    const chemin = await trouverInstallateur(String(requete.params.nom));
    if (!chemin) return void reponse.status(404).json({ ok: false, erreur: "introuvable" });
    reponse.sendFile(chemin, { headers: { "Content-Type": "application/octet-stream" } });
  });

  routes.use(protection.controlerEnTetes);
  // Corps lu tel quel (la signature porte sur ses octets exacts), seulement une fois les en-têtes contrôlés
  routes.use(express.raw({ type: () => true, limit: TAILLE_MAX_VIDEO + 1024 }));
  routes.use(protection.verifierSignature);
  routes.post("/session", protection.ouvrirSession);
  routes.use(protection.verifierSession);
  routes.delete("/session", protection.fermerSession);

  routes.get("/tableau-de-bord", c.tableauDeBord);
  routes.get("/maj/jeton", (_requete, reponse) => void reponse.json(creerJetonMaj()));
  routes.get("/statistiques", c.statistiques);
  routes.get("/statistiques/direct", (requete, reponse) => {
    reponse.json(lireDirect ? lireDirect(requete.query.source === "app" ? "app" : "site") : { visites: 0, pages: [] });
  });
  routes.get("/objectif", c.objectif);
  routes.put("/objectif", c.fixerObjectif);
  routes.get("/journal", c.journal);

  routes.get("/newsletter/inscrits", c.inscrits);
  routes.delete("/newsletter/inscrits/:id", c.desinscrire);
  routes.get("/newsletter/export", c.exporter);
  routes.get("/newsletter/boite", c.boite);
  routes.post("/newsletter/boite/synchroniser", c.synchroniserBoite);
  routes.get("/newsletter/brouillons", c.brouillons);
  routes.post("/newsletter/brouillons", c.enregistrerBrouillon);
  routes.get("/newsletter/brouillons/:id", c.brouillon);
  routes.put("/newsletter/brouillons/:id", c.enregistrerBrouillon);
  routes.delete("/newsletter/brouillons/:id", c.supprimerBrouillon);

  routes.get("/lieux", c.lieux);
  routes.post("/lieux", c.enregistrerLieu);
  routes.post("/lieux/lot", c.lotLieux);
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

  routes.get("/demandes", c.demandes);
  routes.post("/demandes/:id/accepter", c.accepterDemande);
  routes.post("/demandes/:id/refuser", c.refuserDemande);
  routes.delete("/demandes/:id/contact", c.effacerContactDemande);

  routes.get("/annonces", c.annonces);
  routes.post("/annonces", c.creerAnnonce);
  routes.delete("/annonces/:id", c.retirerAnnonce);

  routes.get("/sauvegardes", c.sauvegardes);
  routes.post("/sauvegardes", c.sauvegarder);
  routes.get("/sauvegardes/:nom", c.telechargerSauvegarde);
  routes.get("/geocodage", c.geocodage);

  routes.get("/maintenance", c.maintenance);
  routes.post("/maintenance/relancer", c.relancer);

  routes.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  return routes;
}
