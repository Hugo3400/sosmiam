// Contrôleur des réservations dans le logiciel de gestion : le bilan par lieu sur 30, 90 ou 365 jours (lecture seule).
import type { Request, Response } from "express";

import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { lireParametre } from "./lire-champs.ts";

const PERIODES = [30, 90, 365];

export function creerControleursReservationsGestion(s: ServicesGestion) {
  return {
    /** GET /reservations?jours=30|90|365&ville= */
    bilan: async (requete: Request, reponse: Response) => {
      const jours = Number(requete.query.jours);
      reponse.json(await s.lireReservationsGestion({ jours: PERIODES.includes(jours) ? jours : 30, ville: lireParametre(requete.query.ville, 80) }));
    },
  };
}
