// Tous les services de l'app en version API (le compte connecté), à la place de la démo ou des services « indisponibles ».

import type { AvisPublic, ResumeAvis } from "../../types/avis.ts";
import type { ReservationPro } from "../../types/reservation.ts";
import type { StatutAmbassadeur } from "../../types/roles.ts";
import type { ClientHttp } from "../client-http.ts";
import type { Services } from "../services.ts";
import { creerAmbassadeurApi } from "./api-ambassadeur.ts";
import { creerAvisApi } from "./api-avis.ts";
import { creerComptoirApi } from "./api-comptoir.ts";
import { creerFideliteApi } from "./api-fidelite.ts";
import { creerMiamSafeApi } from "./api-miam-safe.ts";
import { creerReservationsApi } from "./api-reservations.ts";
import { creerSuggestionsApi } from "./api-suggestions.ts";
import { creerVisitesApi } from "./api-visites.ts";

/** `lireStatutAmbassadeur` : relu dans le compte de la session à chaque appel de l'espace ambassadeur */
export function creerServicesApi(client: ClientHttp, o: { lireStatutAmbassadeur: () => StatutAmbassadeur | null }): Services {
  return {
    source: "api",
    visites: creerVisitesApi(client),
    fidelite: creerFideliteApi(client),
    reservations: creerReservationsApi(client),
    avis: creerAvisApi(client),
    comptoir: {
      ...creerComptoirApi(client),
      // Réservations et avis du lieu, côté équipe (routes /pro/comptoir)
      listerReservations: (lieuId) => client.demander<{ reservations: ReservationPro[] }>("GET", `/pro/comptoir/lieux/${lieuId}/reservations`),
      repondreReservation: (id, reponse) =>
        reponse.accepter
          ? client.demander<{ reservation: ReservationPro }>("POST", `/pro/comptoir/reservations/${id}/accepter`)
          : client.demander<{ reservation: ReservationPro }>("POST", `/pro/comptoir/reservations/${id}/refuser`, { corps: { motif: reponse.motif } }),
      marquerArrivee: (id, venu) => client.demander<{ reservation: ReservationPro }>("POST", `/pro/comptoir/reservations/${id}/${venu ? "venu" : "absent"}`),
      listerAvis: (lieuId) => client.demander<{ resume: ResumeAvis; avis: AvisPublic[] }>("GET", `/pro/comptoir/lieux/${lieuId}/avis`),
      repondreAvis: (avisId, texte) => client.demander<{ avis: AvisPublic }>("POST", `/pro/comptoir/avis/${avisId}/reponse`, { corps: { texte } }),
    },
    ambassadeur: creerAmbassadeurApi(client, o.lireStatutAmbassadeur),
    suggestions: creerSuggestionsApi(client),
    miamSafe: creerMiamSafeApi(client),
  };
}
