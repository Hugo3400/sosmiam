// Le SOS du soir, le message du moment, les statistiques et les événements d'un lieu, version API (routes /pro/comptoir).

import { REGLES_IMAGES_LIEU } from "../../regles/images-lieu.ts";
import type { EvenementLieuPro } from "../../types/evenement.ts";
import type { MomentLieu } from "../../types/moment-lieu.ts";
import type { StatistiquesSemaine } from "../../types/statistiques-lieu.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceLieuPro } from "../contrat-lieu-pro.ts";

export function creerLieuProApi(client: ClientHttp): ServiceLieuPro {
  const lieu = (id: number) => `/pro/comptoir/lieux/${id}`;
  return {
    lireMoment: (id) => client.demander<{ moment: MomentLieu }>("GET", `${lieu(id)}/moment`),
    lancerSos: (id, sos) =>
      client.demander<{ moment: MomentLieu }>("POST", `${lieu(id)}/sos`, {
        corps: { places: sos.places, ...(sos.offre ? { offre: sos.offre } : {}), ...(sos.jusqua ? { jusqua: sos.jusqua } : {}) },
      }),
    arreterSos: (id) => client.demander<{ moment: MomentLieu }>("DELETE", `${lieu(id)}/sos`),
    reglerMessage: (id, message) =>
      client.demander<{ moment: MomentLieu }>("PUT", `${lieu(id)}/message`, { corps: { texte: message.texte, ...(message.jusqua ? { jusqua: message.jusqua } : {}) } }),
    effacerMessage: (id) => client.demander<{ moment: MomentLieu }>("DELETE", `${lieu(id)}/message`),
    lireStatistiques: (id, semaines) =>
      client.demander<{ semaines: StatistiquesSemaine[] }>("GET", `${lieu(id)}/statistiques${semaines ? `?semaines=${semaines}` : ""}`),
    listerEvenements: (id) => client.demander<{ evenements: EvenementLieuPro[] }>("GET", `${lieu(id)}/evenements`),
    creerEvenement: (id, reglage) => client.demander<{ evenement: EvenementLieuPro }>("POST", `${lieu(id)}/evenements`, { corps: reglage }),
    modifierEvenement: (id, evenementId, reglage) =>
      client.demander<{ evenement: EvenementLieuPro }>("PUT", `${lieu(id)}/evenements/${evenementId}`, { corps: reglage }),
    annulerEvenement: (id, evenementId) => client.demander<{ evenement: EvenementLieuPro }>("DELETE", `${lieu(id)}/evenements/${evenementId}`),
    envoyerImage: (id, quelle, octets) => client.envoyerOctets<{ adresse: string }>(`${lieu(id)}/${quelle}`, octets, REGLES_IMAGES_LIEU[quelle].type, undefined, "PUT"),
    retirerImage: (id, quelle) => client.demander("DELETE", `${lieu(id)}/${quelle}`),
  };
}
