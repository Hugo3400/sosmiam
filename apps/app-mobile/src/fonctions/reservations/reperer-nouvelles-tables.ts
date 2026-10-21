import type { ReservationPro } from "@sos-miam/commun/types/reservation";

export function repererNouvellesTables(dejaVues: ReadonlySet<number> | null, reservations: readonly ReservationPro[]): ReservationPro[] {
  if (dejaVues === null) return [];
  return reservations.filter((r) => !dejaVues.has(r.id) && (r.statut === "demandee" || (r.statut === "acceptee" && r.automatique)));
}
