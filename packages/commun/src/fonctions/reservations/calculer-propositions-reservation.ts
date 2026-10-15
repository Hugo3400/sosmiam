import type { OccupationReservation, ReglagesReservations } from "../../types/reglages-reservations.ts";
import type { PropositionReservationPro, StatutReservation } from "../../types/reservation.ts";
import { calculerPlaceHoraire } from "./calculer-place-horaire.ts";
import { lireCreneauxProposes } from "./lire-creneaux-proposes.ts";

export function calculerPropositionsReservation(
  r: { statut: StatutReservation; creneau: string; creneauxProposes?: readonly string[] },
  reglages: ReglagesReservations | null,
  occupees: readonly OccupationReservation[],
): PropositionReservationPro[] {
  if (r.statut !== "demandee") return [{ creneau: r.creneau, places: null, horsReglages: false, jourFerme: false }];
  return lireCreneauxProposes(r).map((creneau) => ({ creneau, ...calculerPlaceHoraire(reglages, occupees, creneau) }));
}
