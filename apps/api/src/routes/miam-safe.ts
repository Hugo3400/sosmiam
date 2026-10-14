import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleursMiamSafe, type DependancesMiamSafe } from "../controleurs/miam-safe.ts";
import { creerControleursPartagesMiamSafe } from "../controleurs/partages-miam-safe.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { creerProtectionPro } from "../middlewares/proteger-pro.ts";
import type { ServicesPro } from "../services/pro-regles.ts";

/** Alertes silencieuses : 3 par compte toutes les 10 minutes (assez pour réessayer, pas assez pour harceler un lieu) */
export const LIMITE_ALERTES = { fenetre: 10 * 60_000, maximum: 3 };
/** Signalements Miam Safe : 5 par compte et par 24 heures */
export const LIMITE_SIGNALEMENTS = { fenetre: 24 * 3600_000, maximum: 5 };
/** « Tu t'es senti·e bien ici ? » : 30 réponses par compte et par heure */
export const LIMITE_SENTI_BIEN = { fenetre: 3600_000, maximum: 30 };
/** Lecture publique du badge d'un lieu : 120 par visiteur et par minute */
export const LIMITE_LECTURE_LIEU = { fenetre: 60_000, maximum: 120 };
/** « Prévenir un pote » : 10 par compte toutes les 10 minutes (plusieurs potes, sans pouvoir harceler) */
export const LIMITE_PREVENIR_POTE = { fenetre: 10 * 60_000, maximum: 10 };
/** Positions envoyées pendant un partage : 12 par compte et par minute (l'app en envoie une toutes les 15 à 30 s) */
export const LIMITE_POSITIONS = { fenetre: 60_000, maximum: 12 };
/** Lectures des partages (le pote relit la position toutes les 10 s) : 30 par compte et par minute */
export const LIMITE_LECTURE_PARTAGES = { fenetre: 60_000, maximum: 30 };

/**
 * /miam-safe/… : se sentir en sécurité dans un lieu (docs/decisions.md, « Miam Safe »). Appelé par l'app (et le site),
 * avec la session du compte unique (en-tête X-Session-Compte), jamais en cache ; erreurs { ok:false, erreur, champ? }.
 *
 * Sans session :
 * GET  /miam-safe/lieux/:id              → 200 { ok, engage, repere } (charte signée ; « Les Miamis s'y sentent bien » :
 *                                          90 % de oui sur au moins 20 réponses) · 404 lieu-inconnu (inconnu ou pas publié)
 * Session obligatoire (401 session-expiree sinon) :
 * POST /miam-safe/alertes                { lieuId, endroit: "salle"|"terrasse"|"toilettes"|"ailleurs", detail? (80 car.) }
 *                                        → 201 { ok, id } : l'équipe du lieu reçoit tout de suite une notification « urgente »
 *                                          (prénom du compte, endroit, détail ; jamais le nom ni la photo)
 *                                        · 400 champ-invalide {champ} · 404 lieu-inconnu · 409 pas-miam-safe (pas de charte
 *                                          active : l'app propose les secours ou un pote) · 429 (3 par compte par 10 min)
 * GET  /miam-safe/alertes/:id            → 200 { ok, alerte: { id, statut: "envoyee"|"en-route"|"sans-reponse", creeLe,
 *                                          repondueLe } } (« sans-reponse » : 2 minutes sans « On arrive ») · 404 alerte-inconnue
 *                                          (pas la sienne, ou effacée : on garde une alerte 30 jours)
 * POST /miam-safe/signalements           { lieuId, raison: "harcelement"|"agression"|"discrimination"|"personnel"|"autre",
 *                                          explication? (500 car. ; 10 au moins pour « autre ») } → 201 { ok } : jamais
 *                                          affiché sur la fiche, lu par l'équipe sous 48 h · 404 lieu-inconnu · 429 (5 par 24 h)
 * PUT  /miam-safe/lieux/:id/senti-bien   { oui: boolean } → 200 { ok } (la dernière réponse compte) · 404 lieu-inconnu
 * « Prévenir un pote » de sa bande (position chiffrée dans la base, effacée dès la fin du partage, jamais dans un journal ;
 * un pote retiré ou bloqué ne voit plus rien). partage = { id, sens: "envoye"|"recu", personne: PersonneResume (l'autre),
 * lieu: { id, nom } | null, avecPosition, position: { latitude, longitude, precisionM, le } | null (seulement en cours),
 * creeLe, expireLe, actif } :
 * POST   /miam-safe/prevenir             { pote: identifiant public, lieuId, partagerPosition? (vrai par défaut ; faux : aucune
 *                                          position, jamais), position?: { latitude, longitude, precisionM? } }
 *                                        → 201 { ok, partage, telephones } : notification urgente au pote, position partagée
 *                                          1 h ; telephones = sur combien de ses téléphones elle est partie (0 : il n'est PAS
 *                                          prévenu, l'app propose d'appeler) · 400 champ-invalide · 404 pote-inconnu (pas dans
 *                                          ta bande, inconnu, blocage) · 404 lieu-inconnu · 429 (10 par 10 min)
 * PUT    /miam-safe/partages/:id/position { latitude, longitude, precisionM? } → 200 { ok, expireLe } (la personne qui
 *                                          partage) · 404 partage-inconnu · 410 partage-termine (arrêté, l'heure passée, plus
 *                                          potes : il s'arrête alors) · 409 position-non-partagee (interrupteur coupé) · 503
 *                                          chiffrement-indisponible · 429 (12 par minute)
 * DELETE /miam-safe/partages/:id         → 200 { ok } : arrêté, position effacée (la personne qui partage) · 404 partage-inconnu
 * GET    /miam-safe/partages             → 200 { ok, partages } : en cours, envoyés et reçus · 429 (30 par minute)
 * GET    /miam-safe/partages/:id         → 200 { ok, partage } (la personne qui partage, ou son pote) · 404 partage-inconnu
 * Équipe du lieu (18 ans et plus d'abord : 403 reserve-aux-majeurs si l'âge connu est sous 18 ans, 503 chiffrement-indisponible
 * si la date gardée est illisible, un compte sans date passe ; puis rattachement VALIDÉ, sinon 403 pas-pro ; « gérant » là
 * où c'est écrit, sinon 403 reserve-au-gerant) :
 * GET    /miam-safe/pro/lieux/:id/alertes            → 200 { ok, alertes: [{ id, prenom, endroit, detail, statut, creeLe }] }
 *                                                      (2 dernières heures, les plus récentes d'abord)
 * POST   /miam-safe/pro/lieux/:id/alertes/:alerteId/on-arrive → 200 { ok } (la personne voit « L'équipe arrive ») ·
 *                                                      404 alerte-inconnue
 * GET    /miam-safe/pro/lieux/:id/charte             → 200 { ok, charte: { signee, signeeLe, retireeParEquipe } }
 * PUT    /miam-safe/pro/lieux/:id/charte (gérant)    { accepte: true } → 200 { ok, charte } · 409 charte-retiree (retirée par
 *                                                      l'équipe SOS Miam après un signalement : elle seule peut la rendre)
 * DELETE /miam-safe/pro/lieux/:id/charte (gérant)    → 200 { ok, charte }
 */
export function creerRoutesMiamSafe(
  dependances: DependancesMiamSafe,
  servicesPro: Pick<ServicesPro, "lireRole">,
  protection: ProtectionComptes,
  limiteConnectee: RequestHandler,
  horloge: () => number = Date.now,
  /** Les adresses /miam-safe/pro/… : réservées aux 18 ans et plus (middlewares/exiger-majeur.ts) */
  exigerMajeur: RequestHandler,
) {
  const c = creerControleursMiamSafe(dependances, horloge);
  const exigerRattachement = creerProtectionPro(servicesPro);
  const parCompte = (reglages: { fenetre: number; maximum: number }) =>
    limiterRequetes({ ...reglages, cle: (_requete, reponse) => `compte:${lireCompteId(reponse)}` });
  const routes = Router();

  routes.get("/lieux/:id", limiterRequetes(LIMITE_LECTURE_LIEU), c.lireLieu);
  routes.use(limiteConnectee, protection.exigerCompte);
  routes.post("/alertes", parCompte(LIMITE_ALERTES), c.envoyerAlerte);
  routes.get("/alertes/:id", c.suivreAlerte);
  routes.post("/signalements", parCompte(LIMITE_SIGNALEMENTS), c.signaler);
  routes.put("/lieux/:id/senti-bien", parCompte(LIMITE_SENTI_BIEN), c.repondreSentiBien);
  if (dependances.partages) {
    const p = creerControleursPartagesMiamSafe(dependances.partages, horloge);
    routes.post("/prevenir", parCompte(LIMITE_PREVENIR_POTE), p.prevenir);
    routes.put("/partages/:id/position", parCompte(LIMITE_POSITIONS), p.envoyerPosition);
    routes.delete("/partages/:id", p.arreter);
    routes.get("/partages", parCompte(LIMITE_LECTURE_PARTAGES), p.lister);
    routes.get("/partages/:id", parCompte(LIMITE_LECTURE_PARTAGES), p.lire);
  }
  routes.use("/pro", exigerMajeur);
  routes.get("/pro/lieux/:id/alertes", exigerRattachement(), c.listerAlertes);
  routes.post("/pro/lieux/:id/alertes/:alerteId/on-arrive", exigerRattachement(), c.direOnArrive);
  routes.get("/pro/lieux/:id/charte", exigerRattachement(), c.lireCharte);
  routes.put("/pro/lieux/:id/charte", exigerRattachement(true), c.signerCharte);
  routes.delete("/pro/lieux/:id/charte", exigerRattachement(true), c.quitterCharte);
  routes.use(gererErreursComptes);
  return routes;
}
