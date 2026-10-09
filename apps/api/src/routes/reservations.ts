import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleursReservations } from "../controleurs/reservations.ts";
import type { DependancesVisites } from "../controleurs/visites.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";

/** Lectures (créneaux d'un jour, « Mes réservations », suivi d'une demande), par compte */
export const LIMITE_LECTURES_RESERVATIONS = { fenetre: 10 * 60_000, maximum: 300 };
/** Gestes (annulation, « Je suis là »), par compte */
export const LIMITE_GESTES_RESERVATIONS = { fenetre: 10 * 60_000, maximum: 40 };
/** Demandes de réservation : chacune sonne au comptoir du lieu, donc peu par heure, par compte */
export const LIMITE_DEMANDES_RESERVATIONS = { fenetre: 60 * 60_000, maximum: 20 };

/**
 * /app/reservations : les réservations du compte connecté (session obligatoire : Authorization: Bearer ou
 * X-Session-Compte), jamais en cache. Formes dans packages/commun (types/reservation.ts, client-api/contrat-reservations.ts).
 * Gratuit, sans carte bancaire ; le lieu répond dans l'app avec des motifs fermés (jamais de texte libre du lieu vers le
 * client). Heures : celles du lieu (Paris). Refus : { ok: false, erreur, details?, champ? } — details : { lieu?, lieuId?,
 * distanceM? (arrondie à 100 m), precisionM? } ; 401 session-expiree ; 429 trop-de-demandes (Retry-After). Âge : sans
 * date de naissance gardée (compte du site), 18 ans ; date illisible : traité comme un 15-17 ans. Un bar n'existe pas
 * pour un 15-17 ans (403 mineur-bar, son nom n'est jamais rendu). Un lieu réservable est publié, vérifié (un compte pro)
 * et prend les réservations dans l'app ; sinon 409 lieu-non-reservable { details.lieu }. Lieu non publié : 404 introuvable.
 *
 * GET  /app/reservations/creneaux?lieuId&jour (« AAAA-MM-JJ ») → 200 { ok, creneaux: string[] } (« HH:MM » toutes les
 *          30 min dans les horaires, au moins 30 min après maintenant, d'aujourd'hui à dans 30 jours ; sinon []) · 400
 *          champ-invalide { champ: lieuId | jour } · 403 mineur-bar | membre-du-lieu · 409 lieu-non-reservable
 * POST /app/reservations { lieuId, personnes (1 à 12), jour, heure (un des créneaux), message? (140 caractères, filtre de
 *          mots) } → 201 { ok, reservation: Reservation } (statut « demandee » ; sans réponse, elle expire 30 min avant le
 *          créneau) · 400 champ-invalide { champ: lieuId } | personnes-invalides | creneau-invalide | message-refuse ·
 *          403 mineur-bar | membre-du-lieu | email-non-verifie · 409 lieu-non-reservable | reservation-en-cours { details:
 *          lieu, lieuId } (une demande en attente par lieu) | trop-de-reservations (3 à venir au plus, demandées ou acceptées)
 * GET  /app/reservations                   → 200 { ok, reservations: Reservation[] } (100 au plus, créneau décroissant)
 * GET  /app/reservations/:id               → 200 { ok, reservation } · 404 introuvable (pas la sienne)
 * POST /app/reservations/:id/annuler       → 200 { ok, reservation } : une demande, ou une réservation acceptée avant son
 *          créneau (moins de 2 h avant : tardive, notée) · 409 transition-interdite | delai-depasse (créneau passé)
 * POST /app/reservations/:id/presence { position: LecturePosition } → 200 { ok, reservation, validation:
 *          ResultatValidation | null } : « Je suis là », sur place, d'une heure avant le créneau à 4 h après, une fois.
 *          Si le lieu a déjà touché « Venu », la visite est validée tout de suite (validation : +15, ou +25 si un SOS était
 *          en cours à la demande pour ce créneau ; tampon ; avis dans 1 h), sinon validation: null et la visite comptera
 *          à « Venu » · 400 champ-invalide { champ: position } · 404 introuvable · 409 hors-fenetre-presence |
 *          transition-interdite (pas acceptée, ou présence déjà notée) · 422 hors-zone | position-imprecise |
 *          position-perimee | position-simulee
 * Côté équipe du lieu (accepter, refuser, « Venu », « Pas venu », annuler) : routes/comptoir.ts (/pro/comptoir).
 */
export function creerRoutesReservationsApp(d: DependancesVisites, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number) {
  const c = creerControleursReservations(d, horloge);
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const lectures = parCompte(LIMITE_LECTURES_RESERVATIONS);
  const gestes = parCompte(LIMITE_GESTES_RESERVATIONS);
  const demandes = parCompte(LIMITE_DEMANDES_RESERVATIONS);

  const routes = Router();
  routes.use(limiteConnectee, protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  routes.get("/creneaux", lectures, c.listerCreneaux);
  routes.get("/", lectures, c.lister);
  routes.post("/", demandes, c.reserver);
  routes.get("/:id", lectures, c.lire);
  routes.post("/:id/annuler", gestes, c.annuler);
  routes.post("/:id/presence", gestes, c.signalerPresence);
  routes.use(gererErreursComptes);
  return routes;
}
