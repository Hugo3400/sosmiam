import express, { Router } from "express";

import { creerControleursAmbassadeurs, type OutilsComptes } from "../controleurs/gestion/controleurs-ambassadeurs.ts";
import { creerControleursBigSos } from "../controleurs/gestion/controleurs-big-sos.ts";
import { creerControleursBoite } from "../controleurs/gestion/controleurs-boite.ts";
import { creerControleursCertification } from "../controleurs/gestion/controleurs-certification.ts";
import { creerControleursComptesGestion } from "../controleurs/gestion/controleurs-comptes-gestion.ts";
import { creerControleursFondateurs } from "../controleurs/gestion/controleurs-fondateurs.ts";
import { creerControleursCourriels } from "../controleurs/gestion/controleurs-courriels.ts";
import { creerControleursMiamSafe } from "../controleurs/gestion/controleurs-miam-safe.ts";
import { creerControleursModeration } from "../controleurs/gestion/controleurs-moderation.ts";
import { creerControleursNotifications } from "../controleurs/gestion/controleurs-notifications.ts";
import { creerControleursOutilsLieux } from "../controleurs/gestion/controleurs-outils-lieux.ts";
import { creerControleursRattachements } from "../controleurs/gestion/controleurs-rattachements.ts";
import { creerControleursReponsesTypes } from "../controleurs/gestion/controleurs-reponses-types.ts";
import { creerControleursSuggestions } from "../controleurs/gestion/controleurs-suggestions.ts";
import { creerControleursSurveillance, type VisitesGestion } from "../controleurs/gestion/controleurs-surveillance.ts";
import { creerControleursGestion } from "../controleurs/gestion/controleurs-gestion.ts";
import { autoriserOriginesGestion } from "../middlewares/autoriser-origines-gestion.ts";
import { creerProtectionGestion, type StockageSessions } from "../middlewares/proteger-gestion.ts";
import type { ChiffrementDonnees } from "../services/chiffrement-donnees.ts";
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
  /** Points, badges et réinitialisations des comptes (services/comptes.ts) ; actions absentes si non fourni */
  comptes?: OutilsComptes;
  /** Chiffrement du nom et de la date de naissance des comptes (lu une fois au démarrage) ; null si la clé manque */
  chiffrement?: ChiffrementDonnees | null;
  /** Visites décidées par l'équipe (services/visites-gestion.ts de l'App) : « donner raison au client » ; absent → 503 */
  visites?: VisitesGestion;
  /** « En ce moment » : visites actives et pages regardées (compteur de visites de l'API) */
  lireDirect?: (source: "site" | "app") => { visites: number; pages: { valeur: string; nombre: number }[] };
};

/** /api-gestion/… : les routes du logiciel de gestion, toutes signées par un poste autorisé (voir proteger-gestion.ts). */
export function creerRoutesGestion({ lireAcces, services, horloge, sessions, lireDirect, comptes, chiffrement = null, visites }: DependancesGestion) {
  const protection = creerProtectionGestion(lireAcces, horloge, sessions);
  const c = creerControleursGestion(services, comptes);
  const a = creerControleursAmbassadeurs(services, comptes);
  const f = creerControleursFondateurs(services, comptes);
  const cert = creerControleursCertification(services);
  const sug = creerControleursSuggestions(services);
  const outilsLieux = creerControleursOutilsLieux(services);
  const boite = creerControleursBoite(services);
  const rattachements = creerControleursRattachements(services);
  const m = creerControleursCourriels(services);
  const k = creerControleursComptesGestion(services, comptes, chiffrement);
  const surveillance = creerControleursSurveillance(services, visites);
  const g = creerControleursBigSos(services);
  const n = creerControleursNotifications(services);
  const o = creerControleursModeration(services);
  const safe = creerControleursMiamSafe(services);
  const r = creerControleursReponsesTypes(services);
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
  // Le logiciel vérifie qu'une session gardée sur le PC est encore valable (sinon il redemande le code)
  routes.get("/session", (_requete, reponse) => {
    reponse.json({ ok: true, poste: (reponse.locals.gestion as { poste: { nom: string } }).poste.nom });
  });

  routes.get("/tableau-de-bord", c.tableauDeBord);
  routes.get("/alertes", c.alertes);
  routes.get("/statistiques/communaute", c.communaute);
  routes.get("/statistiques/bilan", c.bilan);
  routes.get("/recherche", c.recherche);
  routes.get("/calendrier", c.calendrier);
  routes.get("/reponses-types", r.liste);
  routes.post("/reponses-types", r.creer);
  routes.put("/reponses-types/:id", r.modifier);
  routes.delete("/reponses-types/:id", r.supprimer);
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
  routes.get("/newsletter/destinataires", m.destinataires);
  routes.get("/newsletter/envois", m.campagnes);
  routes.post("/newsletter/envois", m.lancer);
  routes.post("/newsletter/envois/:id/annuler", m.annuler);
  routes.get("/courriels/etat", m.etat);
  routes.get("/notifications", n.liste);
  routes.get("/notifications/estimation", n.estimation);
  routes.post("/notifications", n.creer);
  routes.post("/notifications/:id/annuler", n.annuler);
  routes.get("/big-sos", g.liste);
  routes.post("/big-sos", g.creer);
  routes.get("/big-sos/:id", g.fiche);
  routes.put("/big-sos/:id", g.modifier);
  routes.delete("/big-sos/:id", g.supprimer);
  routes.post("/big-sos/:id/verification", g.verification);
  routes.post("/big-sos/:id/decision", g.decider);
  routes.get("/comptes", k.liste);
  routes.get("/comptes/:id", k.fiche);
  routes.get("/comptes/:id/donnees", k.exporter);
  routes.get("/comptes/:id/date-naissance", k.dateNaissance);
  routes.put("/comptes/:id/date-naissance", k.corrigerDateNaissance);
  routes.post("/comptes/:id/deconnecter", k.deconnecter);
  routes.post("/comptes/:id/reinitialiser", k.reinitialiser);
  routes.delete("/comptes/:id", k.supprimer);
  // Surveillance des visites : comptes louches, lieux qui refusent beaucoup, contestations (rien n'est bloqué tout seul)
  routes.get("/surveillance", surveillance.lire);
  routes.put("/surveillance/seuils", surveillance.regler);
  routes.post("/surveillance/comptes/:id/vu", surveillance.vuCompte);
  routes.post("/surveillance/lieux/:id/vu", surveillance.vuLieu);
  routes.post("/surveillance/contestations/:id/relue", surveillance.relue);
  routes.post("/surveillance/contestations/:id/raison", surveillance.donnerRaison);
  routes.get("/courriels/derniers", m.derniers);
  routes.post("/courriels/essai", m.essai);
  routes.post("/courriels/ecrire", m.ecrire);
  routes.get("/boite", boite.liste);
  routes.get("/boite/:uid", boite.message);
  routes.post("/boite/:uid/repondre", boite.repondre);
  routes.get("/newsletter/brouillons", c.brouillons);
  routes.post("/newsletter/brouillons", c.enregistrerBrouillon);
  routes.get("/newsletter/brouillons/:id", c.brouillon);
  routes.put("/newsletter/brouillons/:id", c.enregistrerBrouillon);
  routes.delete("/newsletter/brouillons/:id", c.supprimerBrouillon);

  routes.get("/lieux", c.lieux);
  routes.post("/lieux", c.enregistrerLieu);
  routes.post("/lieux/lot", c.lotLieux);
  routes.get("/lieux/controle", outilsLieux.controle);
  routes.get("/lieux/semblables", outilsLieux.semblables);
  routes.post("/lieux/import/verifier", outilsLieux.verifierImport);
  routes.post("/lieux/import", outilsLieux.importer);
  routes.get("/villes", outilsLieux.villes);
  routes.get("/villes/lancement", outilsLieux.lancement);
  routes.get("/lieux/:id", c.lieu);
  routes.get("/lieux/:id/historique", c.historiqueLieu);
  routes.get("/suggestions", sug.liste);
  routes.get("/suggestions/:id", sug.fiche);
  routes.post("/suggestions/:id/decision", sug.decider);
  routes.get("/rattachements", rattachements.liste);
  routes.post("/rattachements/:id/decision", rattachements.decider);
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

  routes.get("/moderation", o.signalements);
  routes.post("/moderation/:id/decision", o.decider);
  routes.post("/moderation/:id/contestation", o.contester);

  // Miam Safe : signalements (à lire sous 48 h), alertes silencieuses sans réponse, chartes des lieux
  routes.get("/miam-safe", safe.liste);
  routes.post("/miam-safe/signalements/:id/decision", safe.decider);
  routes.post("/miam-safe/alertes/:id/vue", safe.alerteVue);
  routes.post("/miam-safe/chartes/:id/rendre", safe.rendreCharte);

  routes.get("/demandes", c.demandes);
  routes.post("/demandes/:id/accepter", c.accepterDemande);
  routes.post("/demandes/:id/refuser", c.refuserDemande);
  routes.delete("/demandes/:id/contact", c.effacerContactDemande);

  routes.get("/ambassadeurs", a.liste);
  routes.get("/ambassadeurs/export", a.exporter);
  routes.get("/ambassadeurs/classement", a.classement);
  routes.get("/ambassadeurs/couverture", a.couverture);
  routes.get("/ambassadeurs/:id", a.fiche);
  routes.put("/ambassadeurs/:id", a.modifier);
  routes.delete("/ambassadeurs/:id", a.supprimer);
  routes.post("/ambassadeurs/:id/decision", a.decider);
  routes.post("/ambassadeurs/:id/points", a.points);
  routes.post("/ambassadeurs/:id/palier-ville", a.palierVille);
  routes.post("/ambassadeurs/:id/reinitialiser", a.reinitialiser);
  routes.post("/ambassadeurs/:id/retirer", a.retirer);
  routes.get("/candidatures", f.candidatures);
  routes.post("/candidatures/:id/accepter", f.accepter);
  routes.post("/candidatures/:id/refuser", f.refuser);
  routes.post("/candidatures/:id/commune", f.commune);
  routes.post("/candidatures/:id/liberer", f.liberer);
  routes.get("/fondateurs/zones", f.zones);
  routes.get("/fondateurs/communes", f.communes);
  routes.get("/certifications", cert.candidatures);
  routes.get("/certifies", cert.certifies);
  routes.post("/certifications/:id/accepter", cert.accepter);
  routes.post("/certifications/:id/refuser", cert.refuser);
  routes.post("/ambassadeurs/:id/certification/retirer", cert.retirer);
  routes.get("/missions", a.missions);
  routes.post("/missions", a.creerMission);
  routes.post("/missions/:id/statut", a.statutMission);
  routes.delete("/missions/:id", a.supprimerMission);
  routes.get("/messages-ambassadeurs", a.messages);
  routes.post("/messages-ambassadeurs", a.envoyerMessage);
  routes.delete("/messages-ambassadeurs/:id", a.supprimerMessage);

  routes.get("/annonces", c.annonces);
  routes.post("/annonces", c.creerAnnonce);
  routes.delete("/annonces/:id", c.retirerAnnonce);

  routes.get("/sauvegardes", c.sauvegardes);
  routes.post("/sauvegardes", c.sauvegarder);
  routes.get("/sauvegardes/test", outilsLieux.dernierTestSauvegarde);
  routes.post("/sauvegardes/test", outilsLieux.testerSauvegarde);
  routes.get("/sauvegardes/:nom", c.telechargerSauvegarde);
  routes.get("/geocodage", c.geocodage);

  routes.get("/maintenance", c.maintenance);
  routes.post("/maintenance/relancer", c.relancer);

  routes.use((_requete, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  return routes;
}
