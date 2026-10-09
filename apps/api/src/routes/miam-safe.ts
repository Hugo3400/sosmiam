import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleursMiamSafe, type DependancesMiamSafe } from "../controleurs/miam-safe.ts";
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
 * Équipe du lieu (rattachement VALIDÉ, sinon 403 pas-pro ; « gérant » là où c'est écrit, sinon 403 reserve-au-gerant) :
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
  routes.get("/pro/lieux/:id/alertes", exigerRattachement(), c.listerAlertes);
  routes.post("/pro/lieux/:id/alertes/:alerteId/on-arrive", exigerRattachement(), c.direOnArrive);
  routes.get("/pro/lieux/:id/charte", exigerRattachement(), c.lireCharte);
  routes.put("/pro/lieux/:id/charte", exigerRattachement(true), c.signerCharte);
  routes.delete("/pro/lieux/:id/charte", exigerRattachement(true), c.quitterCharte);
  routes.use(gererErreursComptes);
  return routes;
}
