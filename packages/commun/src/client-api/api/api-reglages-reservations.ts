import type { ClientHttp } from "../client-http.ts";
import type { ReglagesReservationsLus, ServiceReglagesReservations } from "../contrat-reglages-reservations.ts";

export function creerReglagesReservationsApi(client: ClientHttp): ServiceReglagesReservations {
  const chemin = (lieuId: number) => `/pro/comptoir/lieux/${lieuId}/reservations`;
  return {
    lireReglages: (lieuId) => client.demander<ReglagesReservationsLus>("GET", `${chemin(lieuId)}/reglages`),
    reglerReservations: (lieuId, reglages) =>
      client.demander<ReglagesReservationsLus>("PUT", `${chemin(lieuId)}/reglages`, {
        corps: { services: reglages.services, acceptation: reglages.acceptation, delai: reglages.delai },
      }),
    fermerJour: (lieuId, jour, ferme) =>
      client.demander<ReglagesReservationsLus>(ferme ? "PUT" : "DELETE", `${chemin(lieuId)}/jours-fermes/${encodeURIComponent(jour)}`),
  };
}
