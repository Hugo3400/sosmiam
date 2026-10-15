import { DOUBLON_RESERVATION_MS } from "../../regles/reglages-reservations.ts";
import { RESERVATIONS_A_VENIR_MAX, RESERVATIONS_EN_ATTENTE_PAR_LIEU } from "../../regles/reservations.ts";
import type { NouvelleReservationDuCompte, ReservationDuCompte } from "../../types/decisions-reservations.ts";
import { lireCreneauxProposes } from "./lire-creneaux-proposes.ts";

const lireInstants = (creneaux: readonly string[]) => creneaux.map((c) => Date.parse(c)).sort((a, b) => a - b);

export function verifierLimitesReservationCompte(
  siennes: readonly ReservationDuCompte[],
  nouvelle: NouvelleReservationDuCompte,
  maintenantMs: number,
): "reservation-en-double" | "reservation-en-cours" | "trop-de-reservations" | null {
  const actives = siennes.filter((r) => (r.statut === "demandee" || r.statut === "acceptee") && Date.parse(r.creneau) >= maintenantMs);
  const ici = actives.filter((r) => r.lieuId === nouvelle.lieuId);
  const voulus = lireInstants(nouvelle.creneauxProposes).join(",");
  const enDouble = ici.some((r) => maintenantMs - Date.parse(r.creeLe) < DOUBLON_RESERVATION_MS && lireInstants(lireCreneauxProposes(r)).join(",") === voulus);
  if (enDouble) return "reservation-en-double";
  if (ici.filter((r) => r.statut === "demandee").length >= RESERVATIONS_EN_ATTENTE_PAR_LIEU) return "reservation-en-cours";
  return actives.length >= RESERVATIONS_A_VENIR_MAX ? "trop-de-reservations" : null;
}
