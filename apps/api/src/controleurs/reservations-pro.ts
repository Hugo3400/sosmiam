// Réservations côté équipe du lieu (routes /pro/comptoir/…, voir routes/comptoir.ts) : lecture de la demande et réponse ;
// les points du client sont posés une fois la visite écrite (« Venu » quand il a déjà fait « Je suis là »). Le rôle est
// vérifié par le service, sur la réservation (jamais sur un lieu pris dans la demande).
import type { Request, Response } from "express";

import { MOTIFS_REFUS_RESERVATION } from "../../../../packages/commun/src/regles/reservations.ts";
import type { MotifRefusReservation } from "../../../../packages/commun/src/types/reservation.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { RoleRattachement } from "../services/pro-regles.ts";
import { creerReglagesReservations } from "../services/reglages-reservations.ts";
import type { EchecReservation, ReponseReservation } from "../services/reservations-regles.ts";
import { creerReservationsPro, type ChoixAcceptation } from "../services/reservations-pro.ts";
import { brancherReponsesReservations } from "../services/reponses-reservations.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { repondreEchecReservation } from "./reservations.ts";
import { champInvalide, poserPoints, type DependancesVisites } from "./visites.ts";

/** Un motif de la liste fermée, ou null */
const lireMotif = (brut: unknown): MotifRefusReservation | null =>
  typeof brut === "string" && (MOTIFS_REFUS_RESERVATION as readonly string[]).includes(brut) ? (brut as MotifRefusReservation) : null;

const HORAIRE_MAX = 40;

function lireChoix(corps: Record<string, unknown>): ChoixAcceptation | "creneau" | "depasser" {
  const creneau = corps.creneau ?? null;
  if (creneau !== null && (typeof creneau !== "string" || creneau.length > HORAIRE_MAX)) return "creneau";
  const depasser = corps.depasser ?? false;
  if (typeof depasser !== "boolean") return "depasser";
  return { creneau, depasser };
}

/** `roleDe` : comptoir.roleDe (rattachement validé au lieu) */
export function creerControleursReservationsPro(
  d: DependancesVisites, roleDe: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>, horloge: () => number,
) {
  const { depot, prevenir } = brancherReponsesReservations(d, horloge);
  const reservations = creerReservationsPro({ ...d, depot, roleDe, horloge });
  const reglages = creerReglagesReservations({ ...d, depot, roleDe, horloge });
  const rendre = async (reponse: Response, r: ({ ok: true } & Record<string, unknown>) | EchecReservation) => {
    if (!r.ok) return repondreEchecReservation(reponse, r);
    const { pointsAPoser, reponseLieu, ...corps } = r;
    await poserPoints(d.ajouterPoints, pointsAPoser as Parameters<typeof poserPoints>[1]);
    reponse.json(corps);
    if (reponseLieu) prevenir([reponseLieu as ReponseReservation]);
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

  const jourFerme = (ferme: boolean) => async (requete: Request, reponse: Response) => {
    const lieuId = lire(requete, reponse, "id");
    if (lieuId !== null) await rendre(reponse, await reglages.fermerJour(lireCompteId(reponse), lieuId, String(requete.params.jour ?? ""), ferme));
  };

  return {
    /** GET /pro/comptoir/lieux/:id/reservations */
    async lister(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId !== null) await rendre(reponse, await reservations.lister(lireCompteId(reponse), lieuId));
    },
    async lireReglages(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId !== null) await rendre(reponse, await reglages.lire(lireCompteId(reponse), lieuId));
    },
    async reglerReservations(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId !== null) await rendre(reponse, await reglages.regler(lireCompteId(reponse), lieuId, lireCorps(requete)));
    },
    fermerJour: jourFerme(true),
    rouvrirJour: jourFerme(false),
    async accepter(requete: Request, reponse: Response) {
      const id = lire(requete, reponse, "reservationId");
      if (id === null) return;
      const choix = lireChoix(lireCorps(requete));
      if (typeof choix === "string") return champInvalide(reponse, choix);
      await rendre(reponse, await reservations.accepter(lireCompteId(reponse), id, choix));
    },
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
