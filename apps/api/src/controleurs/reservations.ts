// Réservations côté client (voir routes/reservations.ts) : lecture de la demande, réponse, et les points donnés une fois la
// visite écrite (« Je suis là » quand le lieu a déjà touché « Venu »).
import type { Request, Response } from "express";

import type { DemandeReservation } from "../../../../packages/commun/src/types/reservation.ts";
import { estLecturePositionValide } from "../../../../packages/commun/src/validation/est-lecture-position-valide.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import { creerReservationsClient } from "../services/reservations-client.ts";
import type { EchecReservation, ErreurReservation } from "../services/reservations-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide, poserPoints, type DependancesVisites } from "./visites.ts";

/** Le statut HTTP de chaque refus des réservations (400 pour ce qui n'est pas listé : créneau, personnes, petit mot) */
const STATUTS: Partial<Record<ErreurReservation, number>> = {
  introuvable: 404,
  "mineur-bar": 403, "membre-du-lieu": 403, "compte-limite": 403, "email-non-verifie": 403, "role-requis": 403,
  "lieu-non-reservable": 409, "reservation-en-cours": 409, "trop-de-reservations": 409, "transition-interdite": 409,
  "delai-depasse": 409, "hors-fenetre-presence": 409, "lieu-sans-validation": 409,
  "hors-zone": 422, "position-imprecise": 422, "position-perimee": 422, "position-simulee": 422,
};

/** Un refus des services des réservations, tel quel (avec ses détails : nom du lieu, distance arrondie…) */
export function repondreEchecReservation(reponse: Response, e: EchecReservation) {
  const { ok: _ok, ...corps } = e;
  return reponse.status(STATUTS[e.erreur] ?? 400).json({ ok: false, ...corps });
}

/** Un jour « AAAA-MM-JJ » (la date elle-même est vérifiée par les règles de packages/commun) */
const FORME_JOUR = /^\d{4}-\d{2}-\d{2}$/;

export function creerControleursReservations(d: DependancesVisites, horloge: () => number) {
  const reservations = creerReservationsClient({ ...d, horloge });
  /** Rend { ok, … } (sans les points, déjà posés) ou le refus */
  const rendre = (reponse: Response, r: ({ ok: true } & Record<string, unknown>) | EchecReservation, statut = 200) => {
    if (!r.ok) return repondreEchecReservation(reponse, r);
    const { pointsAPoser: _points, ...corps } = r;
    return reponse.status(statut).json(corps);
  };
  /** L'identifiant de l'adresse, ou null après avoir répondu 400 */
  const lireId = (requete: Request, reponse: Response) => {
    const id = lireIdentifiant(requete.params.id);
    if (id === null) champInvalide(reponse, "id");
    return id;
  };

  return {
    /** GET /app/reservations/creneaux?lieuId&jour */
    async listerCreneaux(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.query.lieuId);
      if (lieuId === null) return champInvalide(reponse, "lieuId");
      const jour = requete.query.jour;
      if (typeof jour !== "string" || !FORME_JOUR.test(jour)) return champInvalide(reponse, "jour");
      rendre(reponse, await reservations.listerCreneaux(lireCompteId(reponse), lieuId, jour));
    },

    /** POST /app/reservations { lieuId, personnes, jour, heure, message? } */
    async reserver(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const lieuId = typeof corps.lieuId === "number" && Number.isInteger(corps.lieuId) && corps.lieuId > 0 && corps.lieuId < 1e9 ? corps.lieuId : null;
      if (lieuId === null) return champInvalide(reponse, "lieuId");
      // Personnes, créneau et petit mot : revérifiés par validerDemandeReservation (packages/commun), forme comprise
      const demande = { lieuId, personnes: corps.personnes, jour: corps.jour, heure: corps.heure, message: corps.message ?? null } as DemandeReservation;
      rendre(reponse, await reservations.reserver(lireCompteId(reponse), demande), 201);
    },

    /** GET /app/reservations */
    async lister(_q: Request, reponse: Response) {
      rendre(reponse, await reservations.listerReservations(lireCompteId(reponse)));
    },

    /** GET /app/reservations/:id */
    async lire(requete: Request, reponse: Response) {
      const id = lireId(requete, reponse);
      if (id !== null) rendre(reponse, await reservations.lireReservation(lireCompteId(reponse), id));
    },

    /** POST /app/reservations/:id/annuler */
    async annuler(requete: Request, reponse: Response) {
      const id = lireId(requete, reponse);
      if (id !== null) rendre(reponse, await reservations.annulerReservation(lireCompteId(reponse), id));
    },

    /** POST /app/reservations/:id/presence { position } */
    async signalerPresence(requete: Request, reponse: Response) {
      const id = lireId(requete, reponse);
      if (id === null) return;
      const position = lireCorps(requete).position;
      if (!estLecturePositionValide(position)) return champInvalide(reponse, "position");
      const r = await reservations.signalerPresence(lireCompteId(reponse), id, position);
      if (r.ok) await poserPoints(d.ajouterPoints, r.pointsAPoser);
      rendre(reponse, r);
    },
  };
}
