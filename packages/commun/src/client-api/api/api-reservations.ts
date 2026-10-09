// Les réservations, version API (routes /app/reservations, contrat dans apps/api/src/routes/reservations.ts).

import type { Reservation } from "../../types/reservation.ts";
import type { ResultatValidation } from "../../types/visite.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceReservations } from "../contrat-reservations.ts";

export function creerReservationsApi(client: ClientHttp): ServiceReservations {
  return {
    listerCreneaux: (lieuId, jour) => client.demander<{ creneaux: string[] }>("GET", `/app/reservations/creneaux?lieuId=${lieuId}&jour=${encodeURIComponent(jour)}`),
    reserver: (demande) => client.demander<{ reservation: Reservation }>("POST", "/app/reservations", { corps: demande }),
    listerReservations: () => client.demander<{ reservations: Reservation[] }>("GET", "/app/reservations"),
    lireReservation: (id) => client.demander<{ reservation: Reservation }>("GET", `/app/reservations/${id}`),
    annulerReservation: (id) => client.demander<{ reservation: Reservation }>("POST", `/app/reservations/${id}/annuler`),
    signalerPresence: (id, position) =>
      client.demander<{ reservation: Reservation; validation: ResultatValidation | null }>("POST", `/app/reservations/${id}/presence`, { corps: { position } }),
  };
}
