import type { ReglagesServicesReservations, ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

const ecrireService = (s: ServiceReservation) =>
  [[...s.jours].sort((a, b) => a - b).join(","), s.premier, s.dernier, s.pas, s.couvertsParService, s.couvertsParCreneau].join("|");

export function sontReglagesIdentiques(a: ReglagesServicesReservations, b: ReglagesServicesReservations): boolean {
  if (a.acceptation !== b.acceptation || a.delai !== b.delai || a.services.length !== b.services.length) return false;
  const servicesA = a.services.map(ecrireService).sort();
  const servicesB = b.services.map(ecrireService).sort();
  return servicesA.every((s, i) => s === servicesB[i]);
}
