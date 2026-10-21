import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

import type { BrouillonService } from "~/fonctions/reservations/verifier-service-reservation";

const TOUS_LES_JOURS = [0, 1, 2, 3, 4, 5, 6];
const DEBUT_SOIR = "18:00";

export function proposerNouveauService(services: readonly ServiceReservation[]): BrouillonService {
  const soirPris = services.some((s) => s.premier >= DEBUT_SOIR);
  const plage = soirPris ? { premier: "12:00", dernier: "13:30" } : { premier: "19:00", dernier: "21:30" };
  return { jours: [...TOUS_LES_JOURS], ...plage, pas: 30, couverts: "", arrivees: null };
}
