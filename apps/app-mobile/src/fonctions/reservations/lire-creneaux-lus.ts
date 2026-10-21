import type { CreneauxReservationLus } from "@sos-miam/commun/client-api/contrat-reservations";

export function lireCreneauxLus(brut: Partial<CreneauxReservationLus>): CreneauxReservationLus {
  const creneaux = Array.isArray(brut.creneaux) ? brut.creneaux.filter((h): h is string => typeof h === "string") : [];
  return {
    creneaux,
    disponibles: Array.isArray(brut.disponibles) ? brut.disponibles : creneaux.map((heure) => ({ heure, peuDePlaces: false })),
    services: Array.isArray(brut.services) ? brut.services : [],
    acceptation: brut.acceptation === "automatique" ? "automatique" : "manuelle",
  };
}
