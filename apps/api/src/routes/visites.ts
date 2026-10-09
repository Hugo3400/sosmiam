import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleursComptoir } from "../controleurs/comptoir.ts";
import { creerControleursMomentLieu } from "../controleurs/moment-lieu.ts";
import { creerControleursVisites, type DependancesVisites } from "../controleurs/visites.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { creerRoutesComptoir } from "./comptoir.ts";

/** Lectures (« Mes visites », cartes, suivi d'une addition toutes les 4 s), par compte */
export const LIMITE_LECTURES_VISITES = { fenetre: 10 * 60_000, maximum: 400 };
/** Gestes (addition, scan, annulation, contestation, demande de récompense), par compte */
export const LIMITE_GESTES_VISITES = { fenetre: 10 * 60_000, maximum: 40 };

/**
 * /app/visites et /app/fidelite : visites et cartes de fidélité du compte connecté (session obligatoire : Authorization:
 * Bearer ou X-Session-Compte), jamais en cache. Formes dans packages/commun (types/visite.ts, types/fidelite.ts).
 * Refus : { ok: false, erreur, details? } — details : { lieu?, lieuId?, distanceM? (arrondie à 100 m), precisionM? } ;
 * 401 session-expiree ; 429 trop-de-demandes. Âge : sans date de naissance gardée (compte du site), 18 ans ; date
 * illisible : traité comme un 15-17 ans. Un bar n'existe pas pour un 15-17 ans (son nom n'est jamais rendu).
 *
 * GET  /app/visites                      → 200 { ok, visites: Visite[] (200 au plus, plus récentes d'abord, sans
 *                                          l'addition en attente), enCours: Visite | null, points (des visites validées) }
 * GET  /app/visites/lieux-qui-valident   → 200 { ok, lieux: number[] } (sans les bars pour un 15-17 ans)
 * GET  /app/visites/lieux/:lieuId        → 200 { ok, infos: InfosVisiteLieu } (pratique et carteDuLieu : null, la fiche
 *                                          /app/lieux/:id fait foi) · 404 introuvable · 403 mineur-bar
 * POST /app/visites/addition { lieuId, position: LecturePosition } → 201 { ok, visite } (code à 4 chiffres, 30 min ;
 *                                          +25 au lieu de +15 si un SOS est en cours à la demande)
 *        · 400 champ-invalide { champ: lieuId | position } · 404 introuvable · 403 mineur-bar | membre-du-lieu |
 *          email-non-verifie · 409 lieu-sans-validation { details.lieu } | demande-en-cours { details: lieu, lieuId } (une
 *          addition en attente à la fois) · 422 hors-zone | position-imprecise | position-perimee | position-simulee
 * POST /app/visites/comptoir { texte (le QR scanné, 300 caractères au plus), position } → 201 ResultatValidation
 *          { ok, visite, carte, recompenseGagnee, dejaValidee: false } ; déjà validée avec ce QR : 200, dejaValidee: true
 *        · 400 qr-illisible | qr-invalide | qr-demo (QR de la démo) · 409 qr-vitrine { details: lieuId, lieu } (QR de
 *          vitrine : il ouvre la fiche) | qr-epuise | lieu-sans-validation · 410 qr-expire · 403 et 422 comme l'addition
 * GET  /app/visites/:id                  → 200 ResultatValidation (suivi d'une addition) · 404 introuvable (pas la sienne)
 * POST /app/visites/:id/annuler          → 200 { ok, visite } · 409 transition-interdite (plus en attente)
 * POST /app/visites/:id/contester { mot? (2 000 caractères au plus, gardé 500) } → 200 { ok, visite } : une visite
 *          refusée ou retirée, relue par l'équipe SOS Miam (jamais par le lieu) · 409 transition-interdite
 * GET    /app/fidelite/cartes            → 200 { ok, cartes: CarteFidelite[] } (récompense prête d'abord)
 * POST   /app/fidelite/cartes/:lieuId/demande → 200 { ok, carte } : un code de 4 chiffres valable 15 min (la même
 *          demande tant qu'elle vaut) · 409 pas-de-recompense
 * DELETE /app/fidelite/cartes/:lieuId/demande → 200 { ok, carte } · 404 introuvable
 * Le comptoir de l'équipe : routes/comptoir.ts (/pro/comptoir).
 */
/** `exigerMajeur` (middlewares/exiger-majeur.ts) : posé sur le comptoir, comme sur tout /pro (403 reserve-aux-majeurs) */
export function creerRoutesVisites(d: DependancesVisites, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number, exigerMajeur?: RequestHandler) {
  const c = creerControleursVisites(d, horloge);
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const avant: RequestHandler[] = [limiteConnectee, protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  }];
  const lectures = parCompte(LIMITE_LECTURES_VISITES);
  const gestes = parCompte(LIMITE_GESTES_VISITES);

  const visites = Router();
  visites.use(...avant);
  visites.get("/", lectures, c.lister);
  visites.get("/lieux-qui-valident", lectures, c.listerLieuxQuiValident);
  visites.get("/lieux/:lieuId", lectures, c.lireInfosLieu);
  visites.post("/addition", gestes, c.demanderAddition);
  visites.post("/comptoir", gestes, c.validerComptoir);
  visites.get("/:id", lectures, c.lireVisite);
  visites.post("/:id/annuler", gestes, c.annulerDemande);
  visites.post("/:id/contester", gestes, c.contesterRefus);
  visites.use(gererErreursComptes);

  const fidelite = Router();
  fidelite.use(...avant);
  fidelite.get("/cartes", lectures, c.listerCartes);
  fidelite.post("/cartes/:lieuId/demande", gestes, c.demanderRecompense);
  fidelite.delete("/cartes/:lieuId/demande", gestes, c.annulerDemandeRecompense);
  fidelite.use(gererErreursComptes);

  const moment = creerControleursMomentLieu(d.moment, (compteId, lieuId) => c.comptoir.roleDe(compteId, lieuId), horloge);
  const avantComptoir = exigerMajeur ? [...avant, exigerMajeur] : avant;
  return { visites, fidelite, comptoir: creerRoutesComptoir(creerControleursComptoir(c.comptoir, d.ajouterPoints), moment, avantComptoir, parCompte) };
}
