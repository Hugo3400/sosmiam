import type { EvenementReservation, Reservation } from "@sos-miam/commun/types/reservation";

import { deciderReservationDemo } from "./decider-reservation-demo";
import { lireDelaiAvisDemo } from "./lire-delai-avis-demo";
import type { ContexteDemo } from "./types-demo";

export function planifierReponseReservationDemo(ctx: ContexteDemo, cible: Pick<Reservation, "id" | "creeLe">, evenement: EvenementReservation, delaiMs: number): void {
  setTimeout(() => {
    ctx.magasin
      .modifier((m, maintenantMs) => {
        const r = m.reservations.find((x) => x.id === cible.id && x.creeLe === cible.creeLe);
        if (!r) return;
        deciderReservationDemo(m, r, evenement, { maintenantMs, client: ctx.lireClient(), delaiAvisMs: lireDelaiAvisDemo(ctx.lireReglages()) });
      })
      .catch(() => {});
  }, delaiMs);
}
