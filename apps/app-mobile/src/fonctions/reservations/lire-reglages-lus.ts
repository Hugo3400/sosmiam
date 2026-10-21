import type { ReglagesReservationsLus } from "@sos-miam/commun/client-api/contrat-reglages-reservations";
import { REGLAGES_RESERVATIONS_DEFAUT } from "@sos-miam/commun/regles/reglages-reservations";

export function lireReglagesLus(brut: Partial<ReglagesReservationsLus>): ReglagesReservationsLus {
  const reglages = brut.reglages ?? REGLAGES_RESERVATIONS_DEFAUT;
  return {
    reglages: {
      services: Array.isArray(reglages.services) ? reglages.services : [],
      acceptation: reglages.acceptation === "automatique" ? "automatique" : "manuelle",
      delai: reglages.delai ?? REGLAGES_RESERVATIONS_DEFAUT.delai,
      joursFermes: Array.isArray(reglages.joursFermes) ? reglages.joursFermes : [],
    },
    regle: brut.regle === true,
    aRevoir: Array.isArray(brut.aRevoir) ? brut.aRevoir : [],
    reservable: brut.reservable !== false,
    ouverture: Array.isArray(brut.ouverture) ? brut.ouverture : [],
  };
}
