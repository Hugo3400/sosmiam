import { Router, type RequestHandler } from "express";

import { creerControleursAvis, type DependancesAvis } from "../controleurs/avis.ts";
import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";

/** Avis d'un lieu, sans session (fiche du lieu, défilement), par IP */
export const LIMITE_LECTURES_AVIS_PUBLICS = { fenetre: 60_000, maximum: 120 };
/** Avis à écrire, avis à relire, par compte */
export const LIMITE_LECTURES_AVIS = { fenetre: 10 * 60_000, maximum: 200 };
/** Avis écrits (vérifiés ou non), par compte */
export const LIMITE_ECRITURES_AVIS = { fenetre: 10 * 60_000, maximum: 20 };
/** Verdicts des ambassadeurs, par compte */
export const LIMITE_RELECTURES_AVIS = { fenetre: 10 * 60_000, maximum: 120 };

/**
 * /app/avis : les avis des lieux (docs/decisions.md, « Scan et validation des visites » et « Lieux vérifiés et non
 * vérifiés »). Formes dans packages/commun (types/avis.ts, types/visite.ts). Refus : { ok: false, erreur, champ?, details? } ;
 * 401 session-expiree ; 429 trop-de-demandes (Retry-After). Un avis est signé « Prénom I. » (prénom seul pour un 15-17 ans,
 * ou sans nom donné), daté au mois (heure de Paris), jamais l'auteur ni son âge. On ne le masque jamais automatiquement :
 * certains partent en relecture (compte de moins de 7 jours, 3 notes tranchées ou plus sur le lieu en 24 h, 1 sur 20 au
 * hasard) et restent visibles ; un ambassadeur donne un verdict consultatif, l'équipe tranche dans le logiciel.
 *
 * Sans session (cache public 60 s) :
 * GET  /app/avis/lieux/:lieuId[?apres=<suite>] → 200 { ok, resume: ResumeAvis, avis: AvisPublic[], suite: string | null } :
 *        les avis visibles du lieu publié, 30 par page, les plus récents d'abord (suite : le curseur de la page suivante) ;
 *        resume : moyenne prudente au dixième, nombre d'avis, part de clients qui reviennent (dès 20 clients, visites
 *        validées par client et jours distincts) · 400 champ-invalide { champ: lieuId | apres } · 404 lieu-inconnu
 *
 * Avec session (Authorization: Bearer ou X-Session-Compte), jamais en cache :
 * GET  /app/avis/a-ecrire → 200 { ok, visites: Visite[] } : les visites validées dont l'avis est ouvert (1 h après la
 *        validation, pendant 14 jours) et pas encore donné, chez un lieu publié, les plus récentes d'abord (50 au plus)
 * POST /app/avis { visiteId, note (1 à 5), texte (10 à 1000 caractères, sans insulte), photo? (null) }
 *        → 201 { ok, pointsGagnes (10 avec une photo, sauf repas offert ; sinon 0), avis: AvisPublic } : un avis par visite,
 *        « Repas offert » si la visite était offerte
 *        · 400 avis-invalide { champ?: photo } (validerAvis ; une photo n'est acceptée qu'une fois l'envoi de photos ouvert)
 *        · 404 introuvable (pas sa visite, lieu plus publié) · 403 membre-du-lieu (rattaché au lieu, ou qui le demande)
 *        · 409 avis-pas-ouvert (visite pas validée, retirée, ou moins d'1 h après) | avis-ferme (14 jours passés) | avis-deja-donne
 * POST /app/avis/non-verifie { lieuId, note, texte, photo? } → 201 { ok, pointsGagnes: 0, avis } : seulement chez un lieu
 *        NON vérifié (sans rattachement validé), sans visite ni points, un par compte et par lieu tous les 30 jours
 *        · 400 avis-invalide · 404 lieu-inconnu · 403 mineur-bar | email-non-verifie | membre-du-lieu
 *        · 409 avis-visite-requise (lieu vérifié) | avis-recent { details.jusqua: ISO 8601, le prochain possible }
 *
 * Ambassadeur actif seulement (sinon 403 ambassadeur-non-actif), jamais en cache :
 * GET  /app/avis/a-relire → 200 { ok, avis: AvisARelire[] } : 20 au plus, le plus ancien d'abord ; jamais l'auteur ni son
 *        âge, jamais l'avis d'un 15-17 ans, jamais le sien, jamais chez un lieu auquel il est rattaché (ou le demande),
 *        jamais un avis déjà relu par lui ni un avis qui a déjà 3 verdicts « ok » ou « louche »
 * POST /app/avis/:id/relecture { verdict: { type: "ok" } | { type: "louche", motif: MotifAvisLouche } | { type: "deporte" } }
 *        → 201 { ok } (consultatif : rien ne change pour l'avis) · 400 champ-invalide { champ: id | verdict }
 *        · 404 introuvable (pas ou plus à relire pour lui) · 409 deja-relu (un verdict par ambassadeur et par avis)
 *
 * Les avis vus du comptoir (liste et réponse du gérant) : routes/comptoir.ts (/pro/comptoir/lieux/:id/avis,
 * /pro/comptoir/avis/:avisId/reponse).
 */
export function creerRoutesAvisApp(d: DependancesAvis, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number) {
  const c = creerControleursAvis(d, horloge);
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const prive: RequestHandler = (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  };
  const lectures = parCompte(LIMITE_LECTURES_AVIS);
  const ecritures = parCompte(LIMITE_ECRITURES_AVIS);
  const relectures = parCompte(LIMITE_RELECTURES_AVIS);
  const ambassadeur: RequestHandler[] = [limiteConnectee, protection.exigerAmbassadeurActif, prive];

  const routes = Router();
  // Sans session : avant la protection du reste du routeur
  routes.get("/lieux/:lieuId", limiterRequetes(LIMITE_LECTURES_AVIS_PUBLICS), c.lireLieu);
  // Ambassadeur actif (exigerAmbassadeurActif ouvre aussi la session)
  routes.get("/a-relire", ...ambassadeur, lectures, c.listerARelire);
  routes.post("/:id/relecture", ...ambassadeur, relectures, c.relire);
  // Tout le reste : session obligatoire
  routes.use(limiteConnectee, protection.exigerCompte, prive);
  routes.get("/a-ecrire", lectures, c.listerAEcrire);
  routes.post("/", ecritures, c.donner);
  routes.post("/non-verifie", ecritures, c.donnerNonVerifie);
  routes.use(gererErreursComptes);
  return routes;
}
