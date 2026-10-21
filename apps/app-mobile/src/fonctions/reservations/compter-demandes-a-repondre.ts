import type { ReservationPro } from "@sos-miam/commun/types/reservation";

export function compterDemandesARepondre(reservations: readonly Pick<ReservationPro, "statut" | "limiteReponse">[], maintenantMs: number): number {
  return reservations.filter((r) => r.statut === "demandee" && (r.limiteReponse === null || Date.parse(r.limiteReponse) > maintenantMs)).length;
}
