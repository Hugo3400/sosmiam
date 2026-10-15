import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { calculerFenetreArrivees } from "~/fonctions/reservations/calculer-fenetre-arrivees";

export type ReservationsProRangees = { aRepondre: ReservationPro[]; aujourdhui: ReservationPro[]; aVenir: ReservationPro[] };

const AU_COMPTOIR = new Set(["acceptee", "honoree", "absent"]);

const trierParCreneau = (a: ReservationPro, b: ReservationPro) => Date.parse(a.creneau) - Date.parse(b.creneau) || a.id - b.id;

export function rangerReservationsPro(reservations: readonly ReservationPro[], maintenantMs: number): ReservationsProRangees {
  const { depuisMs, avantMs } = calculerFenetreArrivees(maintenantMs);
  const tries = [...reservations].sort(trierParCreneau);
  const dansLaJournee = (r: ReservationPro) => {
    const creneauMs = Date.parse(r.creneau);
    return creneauMs >= depuisMs && creneauMs < avantMs;
  };
  return {
    aRepondre: tries.filter((r) => r.statut === "demandee"),
    aujourdhui: tries.filter((r) => AU_COMPTOIR.has(r.statut) && dansLaJournee(r)),
    aVenir: tries.filter((r) => r.statut === "acceptee" && Date.parse(r.creneau) >= avantMs),
  };
}
