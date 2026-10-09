// Réservations côté équipe du lieu (routes /pro/comptoir/…, voir routes/comptoir.ts) : lecture de la demande et réponse ;
// les points du client sont posés une fois la visite écrite (« Venu » quand il a déjà fait « Je suis là »). Le rôle est
// vérifié par le service, sur la réservation (jamais sur un lieu pris dans la demande).
import type { Request, Response } from "express";

import { MOTIFS_REFUS_RESERVATION } from "../../../../packages/commun/src/regles/reservations.ts";
import type { MotifRefusReservation } from "../../../../packages/commun/src/types/reservation.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { RoleRattachement } from "../services/pro-regles.ts";
import type { EchecReservation } from "../services/reservations-regles.ts";
import { creerReservationsPro } from "../services/reservations-pro.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { repondreEchecReservation } from "./reservations.ts";
import { champInvalide, poserPoints, type DependancesVisites } from "./visites.ts";

/** Un motif de la liste fermée, ou null */
const lireMotif = (brut: unknown): MotifRefusReservation | null =>
  typeof brut === "string" && (MOTIFS_REFUS_RESERVATION as readonly string[]).includes(brut) ? (brut as MotifRefusReservation) : null;

/** `roleDe` : comptoir.roleDe (rattachement validé au lieu et 18 ans) */
export function creerControleursReservationsPro(
  d: DependancesVisites, roleDe: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>, horloge: () => number,
) {
  const reservations = creerReservationsPro({ ...d, roleDe, horloge });
  const rendre = async (reponse: Response, r: ({ ok: true } & Record<string, unknown>) | EchecReservation) => {
    if (!r.ok) return repondreEchecReservation(reponse, r);
    const { pointsAPoser, ...corps } = r;
    await poserPoints(d.ajouterPoints, pointsAPoser as Parameters<typeof poserPoints>[1]);
    return reponse.json(corps);
  };
  /** L'identifiant de l'adresse (:id, :reservationId), ou null après avoir répondu 400 */
  const lire = (requete: Request, reponse: Response, nom: string) => {
    const id = lireIdentifiant(requete.params[nom]);
    if (id === null) champInvalide(reponse, nom);
    return id;
  };
  /** Un geste sans corps sur la réservation de l'adresse */
  const geste = (faire: (compteId: number, id: number) => ReturnType<typeof reservations.accepter>) => async (requete: Request, reponse: Response) => {
    const id = lire(requete, reponse, "reservationId");
    if (id !== null) await rendre(reponse, await faire(lireCompteId(reponse), id));
  };
  /** Un geste avec un motif de la liste fermée */
  const gesteMotive = (faire: (compteId: number, id: number, motif: MotifRefusReservation) => ReturnType<typeof reservations.accepter>) =>
    async (requete: Request, reponse: Response) => {
      const id = lire(requete, reponse, "reservationId");
      if (id === null) return;
      const motif = lireMotif(lireCorps(requete).motif);
      if (!motif) return champInvalide(reponse, "motif");
      await rendre(reponse, await faire(lireCompteId(reponse), id, motif));
    };

  return {
    /** GET /pro/comptoir/lieux/:id/reservations */
    async lister(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId !== null) await rendre(reponse, await reservations.lister(lireCompteId(reponse), lieuId));
    },
    /** POST /pro/comptoir/reservations/:reservationId/accepter */
    accepter: geste(reservations.accepter),
    /** POST /pro/comptoir/reservations/:reservationId/refuser { motif } */
    refuser: gesteMotive(reservations.refuser),
    /** POST /pro/comptoir/reservations/:reservationId/annuler { motif } */
    annuler: gesteMotive(reservations.annuler),
    /** POST /pro/comptoir/reservations/:reservationId/venu */
    marquerVenu: geste(reservations.marquerVenu),
    /** POST /pro/comptoir/reservations/:reservationId/absent */
    marquerAbsent: geste(reservations.marquerAbsent),
  };
}
