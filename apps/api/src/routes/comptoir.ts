import { Router, type RequestHandler } from "express";

import type { creerControleursComptoir } from "../controleurs/comptoir.ts";
import type { creerControleursAvisPro } from "../controleurs/avis-pro.ts";
import type { creerControleursEvenementsPro } from "../controleurs/evenements-pro.ts";
import type { creerControleursMomentLieu } from "../controleurs/moment-lieu.ts";
import type { creerControleursReservationsPro } from "../controleurs/reservations-pro.ts";
import type { creerControleursStatistiques } from "../controleurs/statistiques-lieu.ts";
import { gererErreursComptes } from "../middlewares/proteger-comptes.ts";

/** L'écran du comptoir se relit toutes les 5 s (et le programme, les lieux), par compte */
export const LIMITE_LECTURES_COMPTOIR = { fenetre: 10 * 60_000, maximum: 600 };
/** QR montrés, additions réglées, refus, annulations, récompenses offertes, programme, par compte */
export const LIMITE_GESTES_COMPTOIR = { fenetre: 10 * 60_000, maximum: 300 };

/**
 * /pro/comptoir : le comptoir de l'équipe d'un lieu (mode pro de l'app, puis pro.sosmiam.fr), même compte et même session
 * que le reste (Bearer ou X-Session-Compte), jamais en cache. Comme tout /pro : 403 reserve-aux-majeurs sous 18 ans, 503
 * chiffrement-indisponible si la date ne se lit pas (middlewares/exiger-majeur.ts). Il faut aussi un rattachement VALIDÉ au
 * lieu (et 18 ans : sans date gardée, compte du site, 18 ans) ; sinon 403 role-requis (aussi pour un lieu, une visite ou une demande inconnus de
 * l'équipe… sauf 404 introuvable quand la visite ou la demande n'existe pas du tout). Le lieu d'une visite ou d'une demande
 * est relu sur la ressource, jamais pris dans la demande. Formes dans packages/commun (types/comptoir.ts).
 * Réponse des gestes : 200 { ok, etat: EtatComptoir } (l'écran à jour) ; l'équipe ne voit que le prénom, l'initiale du nom,
 * l'emoji, le code et les tampons chez elle. Le QR (qr.texte) est signé par l'API et change toutes les 30 s.
 *
 * GET    /pro/comptoir/lieux                     → 200 { ok, lieux: LieuGere[] } (rattachements validés ; [] sous 18 ans)
 * GET    /pro/comptoir/lieux/:id                 → 200 { ok, etat }
 * POST   /pro/comptoir/lieux/:id/qr { personnes? (1 à 12, 1 par défaut), reglement? (ReglementVisite ; absent : payée) }
 *          → 200 { ok, etat } : QR valable 2 min ou jusqu'à ce que tout le monde ait scanné ; le précédent s'éteint
 *          · 400 champ-invalide { champ: personnes } | reglement-invalide · 409 lieu-sans-validation
 * DELETE /pro/comptoir/lieux/:id/qr              → 200 { ok, etat }
 * POST   /pro/comptoir/visites/:visiteId/reglee { code? (obligatoire dès 2 additions en attente), reglement? }
 *          → 200 { ok, etat } : +15 (ou +25 pendant un SOS), tampon, avis dans 1 h ; offerte : ni points ni tampon
 *          · 409 code-faux | transition-interdite | delai-depasse (plus de 30 min) · 400 reglement-invalide
 * POST   /pro/comptoir/visites/:visiteId/refuser { motif: "introuvable"|"pas-venu"|"doublon"|"autre" } → 200 { ok, etat }
 * POST   /pro/comptoir/visites/:visiteId/annuler { motif } → 200 { ok, etat } : une validation faite par erreur, 15 min au
 *          plus (points rendus, tampon retiré, avis fermé) · 409 delai-depasse | transition-interdite
 * POST   /pro/comptoir/recompenses/:demandeId/offrir → 200 { ok, etat } · 409 delai-depasse (code de plus de 15 min)
 * GET    /pro/comptoir/lieux/:id/programme       → 200 { ok, programme: ProgrammeFidelite | null }
 * PUT    /pro/comptoir/lieux/:id/programme (gérant) { actif, visitesRequises, recompense, alcool, recompenseSansAlcool }
 *          → 200 { ok, programme } · 400 programme-invalide { champ } (validerReglageFidelite) · 403 role-requis (équipe)
 *
 * SOS « place ce soir » et message du moment (gérant ET équipe), réponses { ok, moment: MomentLieu } (types/moment-lieu.ts :
 * le SOS du jour même arrêté, sosPossible, fermeture de ce soir d'après les horaires, message) :
 * GET    /pro/comptoir/lieux/:id/moment          → 200
 * POST   /pro/comptoir/lieux/:id/sos { places (1 à 30), offre? (80 caractères, sans gros mot), jusqua? (ISO) } → 201 : jusqu'à la
 *          fermeture de ce soir (jusqua permet de finir plus tôt ; sans horaires connus, jusqua est obligatoire, 4 h du matin au
 *          plus) · 400 champ-invalide { champ: places | offre | jusqua } · 409 sos-deja-lance (un SOS par jour de Paris, même arrêté)
 * DELETE /pro/comptoir/lieux/:id/sos             → 200 : arrête le SOS en cours (il ne se relance pas le même jour)
 * PUT    /pro/comptoir/lieux/:id/message { texte (80 caractères, sans gros mot), jusqua? } → 200 : sans jusqua, jusqu'à la
 *          fermeture de ce soir, sinon 24 h ; 24 h au plus · 400 champ-invalide { champ: texte | jusqua }
 * DELETE /pro/comptoir/lieux/:id/message         → 200
 *
 * Statistiques du lieu (gérant ET équipe), par semaine de Paris, du lundi au dimanche (types/statistiques-lieu.ts) :
 * GET    /pro/comptoir/lieux/:id/statistiques[?semaines=1..26 (8 par défaut)]
 *          → 200 { ok, semaines: StatistiquesSemaine[] }, de la semaine en cours (la première) à la plus ancienne :
 *          { semaine: "2026-S41", debut: "2026-10-05" (son lundi, jour de Paris), vues (fiche ouverte dans l'app : une par
 *          visiteur et par jour, sans savoir qui), rescousses, visitesValidees (statut « validee », rangées par date de
 *          validation, offertes comprises), nouveauxClients (comptes dont la toute première visite validée ici tombe cette
 *          semaine) } · 400 champ-invalide { champ: id | semaines }
 *
 * Événements du lieu (gérant ET équipe ; docs/decisions.md « Événements des lieux » ; formes : types/evenement.ts, vérifiées
 * par validerEvenement), réponses { ok, evenement: EvenementLieuPro } (prochaine date, statut a-venir | passe | annule,
 * suspendu, nombre d'intéressés, prénom de qui l'a publié). L'événement de l'adresse est relu : s'il n'est pas de ce lieu, 404.
 * GET    /pro/comptoir/lieux/:id/evenements      → 200 { ok, evenements: EvenementLieuPro[] } : à venir (le plus proche
 *          d'abord), puis finis ou annulés depuis 30 jours au plus (le plus récent d'abord)
 * POST   /pro/comptoir/lieux/:id/evenements { ReglageEvenement } → 201 : titre 3 à 60 caractères, type, description 500,
 *          debut (à venir, 3 mois à l'avance au plus), fin? (24 h au plus), hebdoJusqua? (chaque semaine, même jour et même
 *          heure de Paris, au moins une semaine après le début, 3 mois à l'avance au plus), tarif gratuit | prix (prixCentimes
 *          1 à 50 000) | reservation, places? (1 à 500), alcool? (coché d'office si le texte parle d'alcool ; jamais d'open bar)
 *          · 400 evenement-invalide { champ } · 409 trop-d-evenements (10 à venir par lieu, suspendus compris)
 * PUT    /pro/comptoir/lieux/:id/evenements/:evenementId { ReglageEvenement, en entier } → 200 : le début déjà enregistré
 *          reste permis même passé (série déjà commencée) · 400 evenement-invalide { champ } | champ-invalide { champ:
 *          evenementId } · 404 evenement-inconnu · 409 evenement-passe | transition-interdite (annulé)
 * DELETE /pro/comptoir/lieux/:id/evenements/:evenementId → 200 : annulé, toutes ses dates restantes (déjà annulé : rien ne
 *          change) · 404 evenement-inconnu · 409 evenement-passe (un événement fini ne s'annule plus)
 *
 * Avis du lieu (packages/commun, types/avis.ts ; jamais l'auteur ni son âge) :
 * GET    /pro/comptoir/lieux/:id/avis[?apres=<suite>] (gérant ET équipe) → 200 { ok, resume: ResumeAvis, avis: AvisPublic[]
 *          (chacun avec reponseLieu), suite: string | null } : les avis visibles (publiés ou en relecture), 30 par page, les
 *          plus récents d'abord · 400 champ-invalide { champ: id | apres }
 * POST   /pro/comptoir/avis/:avisId/reponse { texte (600 caractères, sans gros mot) } (GÉRANT seulement) → 201 { ok, avis } :
 *          réponse publique publiée tout de suite, relue après par l'équipe SOS Miam ; jamais de message privé au client
 *          · 400 message-refuse { champ: texte } | champ-invalide { champ: avisId } · 403 role-requis (équipe, ou pas ce lieu)
 *          · 404 introuvable (avis inconnu ou masqué) · 409 reponse-deja-donnee (une réponse par avis, même masquée)
 *
 * Réservations faites dans l'app (gérant ET équipe ; le lieu est relu sur la réservation, jamais pris dans la demande).
 * Réponse des gestes : 200 { ok, reservation: ReservationPro } (types/reservation.ts : prénom, initiale, emoji, personnes,
 * créneau, petit mot, statut, presence (« Je suis là » fait), code d'arrivée une fois acceptée ; jamais l'âge) ; 400
 * champ-invalide { champ: id | reservationId } ; 403 role-requis ; 404 introuvable (réservation inconnue).
 * GET    /pro/comptoir/lieux/:id/reservations    → 200 { ok, reservations: ReservationPro[] } : depuis minuit (heure de Paris),
 *          ou depuis 4 h si c'est plus tôt (après minuit, la soirée reste visible), et à venir ; tous statuts, créneau
 *          croissant, 300 au plus
 * POST   /pro/comptoir/reservations/:reservationId/accepter → statut « acceptee », code d'arrivée à 4 chiffres (jamais celui
 *          d'une addition, d'une récompense ou d'une autre table attendue chez le lieu) · 409 delai-depasse (sans réponse
 *          jusqu'à 30 min du créneau : expirée) | transition-interdite
 * POST   /pro/comptoir/reservations/:reservationId/refuser { motif: "complet"|"ferme"|"groupe-trop-grand"|"autre" }
 *          · 400 champ-invalide { champ: motif } · 409 delai-depasse | transition-interdite
 * POST   /pro/comptoir/reservations/:reservationId/annuler { motif } → une réservation acceptée que le lieu ne peut plus
 *          honorer (le client voit le motif) · 400 champ-invalide { champ: motif } · 409 transition-interdite
 * POST   /pro/comptoir/reservations/:reservationId/venu → de 30 min avant le créneau à 4 h après. Si le client a déjà fait
 *          « Je suis là », la visite est validée tout de suite (mode « reservation », « payée » : +15, ou +25 si la demande a
 *          été faite pendant un SOS du lieu pour un créneau avant sa fin ; tampon ; avis dans 1 h ; annulable 15 min comme
 *          les autres validations) ; sinon elle le sera à « Je suis là » · 409 transition-interdite (trop tôt, pas acceptée)
 *          | delai-depasse (plus de 4 h après)
 * POST   /pro/comptoir/reservations/:reservationId/absent → « Pas venu », à partir de 30 min après le créneau (gardé sur la
 *          réservation) · 409 transition-interdite
 * L'écran du comptoir (etat) donne aussi arrivees (réservations acceptées du jour, la plus proche d'abord) et
 * reservationsARepondre (demandes en attente).
 */
/** Les autres gestes de l'équipe au comptoir ; null : routes absentes (non fournies) */
export type ControleursComptoirEnPlus = {
  moment: ReturnType<typeof creerControleursMomentLieu>;
  reservations: ReturnType<typeof creerControleursReservationsPro>;
  statistiques: ReturnType<typeof creerControleursStatistiques> | null;
  evenements: ReturnType<typeof creerControleursEvenementsPro> | null;
  avis: ReturnType<typeof creerControleursAvisPro> | null;
};

export function creerRoutesComptoir(
  c: ReturnType<typeof creerControleursComptoir>,
  { moment, reservations, statistiques, evenements, avis }: ControleursComptoirEnPlus,
  avant: RequestHandler[],
  parCompte: (r: { fenetre: number; maximum: number }) => RequestHandler,
) {
  const lectures = parCompte(LIMITE_LECTURES_COMPTOIR);
  const gestes = parCompte(LIMITE_GESTES_COMPTOIR);
  const routes = Router();
  routes.use(...avant);
  routes.get("/lieux", lectures, c.listerLieux);
  routes.get("/lieux/:id", lectures, c.lire);
  routes.post("/lieux/:id/qr", gestes, c.montrerQr);
  routes.delete("/lieux/:id/qr", gestes, c.cacherQr);
  routes.get("/lieux/:id/programme", lectures, c.lireProgramme);
  routes.put("/lieux/:id/programme", gestes, c.reglerProgramme);
  routes.post("/visites/:visiteId/reglee", gestes, c.marquerReglee);
  routes.post("/visites/:visiteId/refuser", gestes, c.refuser);
  routes.post("/visites/:visiteId/annuler", gestes, c.annulerValidation);
  routes.post("/recompenses/:demandeId/offrir", gestes, c.offrirRecompense);
  routes.get("/lieux/:id/moment", lectures, moment.lire);
  routes.post("/lieux/:id/sos", gestes, moment.lancerSos);
  routes.delete("/lieux/:id/sos", gestes, moment.arreterSos);
  routes.put("/lieux/:id/message", gestes, moment.reglerMessage);
  routes.delete("/lieux/:id/message", gestes, moment.effacerMessage);
  routes.get("/lieux/:id/reservations", lectures, reservations.lister);
  routes.post("/reservations/:reservationId/accepter", gestes, reservations.accepter);
  routes.post("/reservations/:reservationId/refuser", gestes, reservations.refuser);
  routes.post("/reservations/:reservationId/annuler", gestes, reservations.annuler);
  routes.post("/reservations/:reservationId/venu", gestes, reservations.marquerVenu);
  routes.post("/reservations/:reservationId/absent", gestes, reservations.marquerAbsent);
  if (statistiques) routes.get("/lieux/:id/statistiques", lectures, statistiques.lire);
  if (evenements) {
    routes.get("/lieux/:id/evenements", lectures, evenements.lister);
    routes.post("/lieux/:id/evenements", gestes, evenements.creer);
    routes.put("/lieux/:id/evenements/:evenementId", gestes, evenements.modifier);
    routes.delete("/lieux/:id/evenements/:evenementId", gestes, evenements.annuler);
  }
  if (avis) {
    routes.get("/lieux/:id/avis", lectures, avis.lister);
    routes.post("/avis/:avisId/reponse", gestes, avis.repondre);
  }
  routes.use(gererErreursComptes);
  return routes;
}
