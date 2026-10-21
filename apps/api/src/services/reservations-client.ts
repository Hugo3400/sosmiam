// Les réservations côté client (voir routes/reservations.ts) : créneaux d'un lieu, demande, « Mes réservations »,
// annulation et « Je suis là ». Mêmes règles que packages/commun (validerDemandeReservation,
// faireEvoluerReservation) ; position comparée ici, jamais gardée ; e-mail vérifié obligatoire pour réserver.
import type { CreneauxReservationLus, JoursReservationLus } from "../../../../packages/commun/src/client-api/contrat-reservations.ts";
import { calculerCreneauxDemande } from "../../../../packages/commun/src/fonctions/reservations/calculer-creneaux-demande.ts";
import { calculerPersonnesMax } from "../../../../packages/commun/src/fonctions/reservations/calculer-personnes-max.ts";
import { deciderNouvelleReservation } from "../../../../packages/commun/src/fonctions/reservations/decider-nouvelle-reservation.ts";
import { faireEvoluerReservation } from "../../../../packages/commun/src/fonctions/reservations/faire-evoluer-reservation.ts";
import { listerCreneauxDisponibles } from "../../../../packages/commun/src/fonctions/reservations/lister-creneaux-disponibles.ts";
import { listerJoursReservation } from "../../../../packages/commun/src/fonctions/reservations/lister-jours-reservation.ts";
import { listerServicesDuJour } from "../../../../packages/commun/src/fonctions/reservations/lister-services-du-jour.ts";
import { verifierLimitesReservationCompte } from "../../../../packages/commun/src/fonctions/reservations/verifier-limites-reservation-compte.ts";
import { choisirCodeAddition } from "../../../../packages/commun/src/fonctions/visites/choisir-code-addition.ts";
import { REGLAGES_RESERVATIONS_DEFAUT } from "../../../../packages/commun/src/regles/reglages-reservations.ts";
import type { ReservationDuCompte } from "../../../../packages/commun/src/types/decisions-reservations.ts";
import type { LecturePosition } from "../../../../packages/commun/src/types/position.ts";
import type { DemandeReservation, Reservation } from "../../../../packages/commun/src/types/reservation.ts";
import type { ResultatValidation } from "../../../../packages/commun/src/types/visite.ts";
import { validerDemandeReservation } from "../../../../packages/commun/src/validation/valider-demande-reservation.ts";
import { deciderReservation } from "../fonctions/reservations/decider-reservation.ts";
import { presenterReservation } from "../fonctions/reservations/presenter-reservation.ts";
import { construireResultatValidation } from "../fonctions/visites/construire-resultat-validation.ts";
import { RESERVATIONS_RENDUES, type EchecReservation, type LigneReservation, type NouvelleTable } from "./reservations-regles.ts";
import { creerOutilsReservations } from "./reservations-outils.ts";
import type { PointsAPoser } from "./visites-client.ts";
import type { TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites, type ContexteVisites } from "./visites-outils.ts";

type Reponse<T> = ({ ok: true } & T) | EchecReservation;

/** Le petit mot du client, sur une ligne ; null s'il est vide */
const nettoyerMessage = (message: string | null) => {
  const texte = typeof message === "string" ? message.trim().replace(/\s+/g, " ") : "";
  return texte === "" ? null : texte;
};

const versReservationDuCompte = (r: LigneReservation): ReservationDuCompte => ({
  lieuId: r.lieuId, statut: r.statut, creneau: r.creneau.toISOString(), creneauxProposes: r.creneauxProposes.map((x) => x.toISOString()), creeLe: r.creeLe.toISOString(),
});

export function creerReservationsClient(c: ContexteVisites) {
  const o = creerOutilsVisites(c);
  const outils = creerOutilsReservations(c);

  /** Une réservation du client (null : pas la sienne, ou introuvable) */
  async function lireSa(t: TablesVisites, compteId: number, id: number) {
    const r = await t.lireReservation(id);
    return r && r.compteId === compteId ? r : null;
  }

  /** La réservation telle que le client la voit, avec son lieu et la visite qui en est née */
  async function presenter(t: TablesVisites, r: LigneReservation): Promise<Reservation> {
    const [lieux, visites] = await Promise.all([t.resumerLieux([r.lieuId]), outils.lireVisitesNees(t, r.compteId, [r.id])]);
    return presenterReservation(r, lieux.get(r.lieuId) ?? o.lieuDisparu(r.lieuId), visites.get(r.id) ?? null);
  }

  return {
    listerJours(compteId: number, lieuId: number, personnes: number): Promise<Reponse<JoursReservationLus>> {
      return c.depot.lire(async (t) => {
        const maintenant = o.maintenant();
        const lieu = await t.lireLieu(lieuId, maintenant);
        if (!lieu) return o.echec("introuvable");
        const refus = outils.verifierLieu(lieu, await o.lireVisiteur(t, compteId));
        if (refus) return refus;
        const { reglages, occupees } = await outils.lireCapaciteAVenir(t, lieu.id, maintenant);
        const { acceptation, delai } = reglages ?? REGLAGES_RESERVATIONS_DEFAUT;
        const jours = listerJoursReservation({ ouverture: lieu.ouverture, reglages, maintenant, occupees, personnes });
        return { ok: true, jours, acceptation, delai, personnesMax: calculerPersonnesMax(reglages) };
      });
    },

    /** GET /app/reservations/creneaux?lieuId&jour */
    listerCreneaux(compteId: number, lieuId: number, jour: string, personnes = 1): Promise<Reponse<CreneauxReservationLus>> {
      return c.depot.lire(async (t) => {
        const maintenant = o.maintenant();
        const lieu = await t.lireLieu(lieuId, maintenant);
        if (!lieu) return o.echec("introuvable");
        const refus = outils.verifierLieu(lieu, await o.lireVisiteur(t, compteId));
        if (refus) return refus;
        const { reglages, occupees } = await outils.lireCapacite(t, lieu.id, jour, maintenant);
        const disponibles = listerCreneauxDisponibles({ ouverture: lieu.ouverture, reglages, jour, maintenant, occupees, personnes });
        const services = listerServicesDuJour({ reglages, jour, maintenant, occupees, personnes });
        return { ok: true, creneaux: disponibles.map((d) => d.heure), disponibles, services, acceptation: (reglages ?? REGLAGES_RESERVATIONS_DEFAUT).acceptation };
      });
    },

    /** POST /app/reservations : une demande en attente par lieu, 3 réservations à venir au plus */
    reserver(compteId: number, demande: DemandeReservation): Promise<Reponse<{ reservation: Reservation; nouvelleTable: NouvelleTable }>> {
      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        await t.verrouillerCompte(compteId);
        await t.expirerReservations(maintenant, { compteId });
        await t.verrouillerLieu(demande.lieuId);
        const lieu = await t.lireLieu(demande.lieuId, maintenant);
        if (!lieu) return o.echec("introuvable");
        const visiteur = await o.lireVisiteur(t, compteId);
        const refus = outils.verifierLieu(lieu, visiteur) ?? o.verifierEmail(visiteur);
        if (refus) return refus;
        const { reglages, occupees } = await outils.lireCapacite(t, lieu.id, typeof demande.jour === "string" ? demande.jour : "", maintenant);
        const erreur = validerDemandeReservation(demande, lieu.ouverture, maintenant, { reglages, occupees });
        if (erreur) return o.echec(erreur);
        const siennes = await t.listerReservations({ compteId, statuts: ["demandee", "acceptee"], creneauDepuis: maintenant });
        const limite = verifierLimitesReservationCompte(
          siennes.map(versReservationDuCompte), { lieuId: lieu.id, creneauxProposes: calculerCreneauxDemande(demande) }, maintenant.getTime(),
        );
        if (limite === "reservation-en-cours") return o.echec(limite, { lieu: lieu.nom, lieuId: lieu.id });
        if (limite) return outils.echec(limite);
        const decision = deciderNouvelleReservation(demande, { ouverture: lieu.ouverture, reglages, occupees, maintenant });
        if (!decision.ok) return o.echec(decision.erreur);
        const acceptee = decision.statut === "acceptee";
        const r = await t.creerReservation({
          compteId, lieuId: lieu.id, personnes: demande.personnes, creneau: new Date(decision.creneau),
          creneauxProposes: decision.creneauxProposes.map((x) => new Date(x)), automatique: decision.automatique,
          message: nettoyerMessage(demande.message), statut: decision.statut, motifRefus: null, tardive: false, creeLe: maintenant,
          reponduLe: acceptee ? maintenant : null, reponduParId: null, presenceLe: null,
          code: acceptee ? choisirCodeAddition(await t.listerCodesPris(lieu.id, maintenant), c.tirer) : null,
        });
        const resume = o.resumer(lieu);
        return { ok: true, reservation: presenterReservation(r, resume, null), nouvelleTable: { reservation: r, lieu: resume, equipe: await t.listerEquipeLieu(lieu.id) } };
      });
    },

    /** GET /app/reservations : les plus lointaines d'abord (créneau décroissant), 100 au plus */
    listerReservations(compteId: number): Promise<Reponse<{ reservations: Reservation[] }>> {
      return c.depot.lire(async (t) => {
        await t.expirerReservations(o.maintenant(), { compteId });
        const lignes = await t.listerReservations({ compteId, ordre: "creneau-decroissant", limite: RESERVATIONS_RENDUES });
        const [lieux, visites] = await Promise.all([
          t.resumerLieux([...new Set(lignes.map((r) => r.lieuId))]),
          outils.lireVisitesNees(t, compteId, lignes.map((r) => r.id)),
        ]);
        return {
          ok: true,
          reservations: lignes.map((r) => presenterReservation(r, lieux.get(r.lieuId) ?? o.lieuDisparu(r.lieuId), visites.get(r.id) ?? null)),
        };
      });
    },

    /** GET /app/reservations/:id */
    lireReservation(compteId: number, id: number): Promise<Reponse<{ reservation: Reservation }>> {
      return c.depot.lire(async (t) => {
        await t.expirerReservations(o.maintenant(), { compteId });
        const r = await lireSa(t, compteId, id);
        return r ? { ok: true, reservation: await presenter(t, r) } : o.echec("introuvable");
      });
    },

    /** POST /app/reservations/:id/annuler : moins de 2 h avant le créneau, l'annulation d'une réservation acceptée est tardive */
    annulerReservation(compteId: number, id: number): Promise<Reponse<{ reservation: Reservation }>> {
      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        await t.verrouillerCompte(compteId);
        if (!(await lireSa(t, compteId, id))) return o.echec("introuvable");
        await t.verrouillerReservation(id);
        await t.expirerReservations(maintenant, { reservationId: id });
        const r = await lireSa(t, compteId, id);
        if (!r) return o.echec("introuvable");
        const decision = await deciderReservation(t, r, { type: "annuler-client" }, maintenant, null);
        if (!decision.ok) return o.echec(decision.erreur);
        return { ok: true, reservation: await presenter(t, decision.reservation) };
      });
    },

    /**
     * POST /app/reservations/:id/presence { position } : « Je suis là », d'une heure avant le créneau à 4 h après, sur place.
     * Si le lieu a déjà touché « Venu », la visite est validée tout de suite (`validation`), sinon elle le sera à « Venu ».
     */
    signalerPresence(
      compteId: number, id: number, position: LecturePosition,
    ): Promise<Reponse<{ reservation: Reservation; validation: ResultatValidation | null; pointsAPoser: PointsAPoser }>> {
      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        await t.verrouillerCompte(compteId);
        const r = await lireSa(t, compteId, id);
        if (!r) return o.echec("introuvable");
        // La fenêtre d'abord : pas la peine de parler de distance deux jours avant
        const essai = faireEvoluerReservation(
          { statut: r.statut, creneau: r.creneau.toISOString(), presenceLe: r.presenceLe?.toISOString() ?? null, reponduLe: r.reponduLe?.toISOString() ?? null },
          { type: "presence" }, maintenant.getTime(),
        );
        if (!essai.ok) return o.echec(essai.erreur);
        const lieu = await t.lireLieu(r.lieuId, maintenant);
        if (!lieu) return o.echec("introuvable");
        const refusPosition = o.verifierPosition(position, lieu);
        if (refusPosition) return refusPosition;
        const decision = await deciderReservation(t, r, { type: "presence" }, maintenant, null);
        if (!decision.ok) return o.echec(decision.erreur);
        const nee = decision.creerVisite ? await outils.honorer(t, decision.reservation, maintenant) : null;
        const resume = o.resumer(lieu);
        const validation = nee ? await construireResultatValidation(t, nee.visite, resume, nee.recompenseGagnee, maintenant) : null;
        return {
          ok: true,
          reservation: presenterReservation(decision.reservation, resume, nee?.visite.id ?? null),
          validation,
          pointsAPoser: { compteId, points: nee?.points ?? [] },
        };
      });
    },
  };
}
