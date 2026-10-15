import type { NomServiceReservation } from "../../types/reglages-reservations.ts";
import { lireMomentCreneau } from "./lire-moment-creneau.ts";

type ServiceANommer = { premier: string; jours?: readonly number[] };

export function nommerServiceReservation(service: ServiceANommer, services: readonly ServiceANommer[]): NomServiceReservation {
  const moment = lireMomentCreneau(service.premier);
  const partageUnJour = (autre: ServiceANommer) => !service.jours || !autre.jours || autre.jours.some((jour) => service.jours!.includes(jour));
  const autres = services.filter((autre) => autre !== service && autre.premier !== service.premier && lireMomentCreneau(autre.premier) === moment && partageUnJour(autre));
  if (autres.length === 0) return { moment, rang: null };
  return { moment, rang: 1 + autres.filter((autre) => autre.premier < service.premier).length };
}
