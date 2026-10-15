import type { DemandeReservation } from "../../types/reservation.ts";
import { calculerInstantParis } from "../temps/calculer-instant-paris.ts";

export function calculerCreneauxDemande(demande: Pick<DemandeReservation, "jour" | "heure" | "autresHeures">): string[] {
  return [demande.heure, ...(demande.autresHeures ?? [])].map((heure) => {
    const instant = calculerInstantParis(demande.jour, heure);
    return Number.isNaN(instant) ? "" : new Date(instant).toISOString();
  });
}
