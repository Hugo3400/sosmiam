import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

import type { BrouillonService } from "~/fonctions/reservations/verifier-service-reservation";

export function lireBrouillonService(service: ServiceReservation): BrouillonService {
  return {
    jours: [...service.jours],
    premier: service.premier,
    dernier: service.dernier,
    pas: service.pas,
    couverts: String(service.couvertsParService),
    arrivees: service.couvertsParCreneau < service.couvertsParService ? String(service.couvertsParCreneau) : null,
  };
}
