// Le service des visites, version API (routes /app/visites, contrat dans apps/api/src/routes/visites.ts).

import { INTERVALLE_SUIVI_DEMANDE_MS } from "../../regles/visites.ts";
import type { InfosVisiteLieu, ResultatValidation, Visite } from "../../types/visite.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceVisites } from "../contrat-visites.ts";
import { creerEcouteReguliere } from "./creer-ecoute-reguliere.ts";

/** Les visites lues et demandées à l'API ; les écrans abonnés relisent toutes les 4 s (suivi d'une addition). */
export function creerVisitesApi(client: ClientHttp): ServiceVisites {
  return {
    lireLieu: (lieuId) => client.demander<{ infos: InfosVisiteLieu }>("GET", `/app/visites/lieux/${lieuId}`),
    listerLieuxQuiValident: () => client.demander<{ lieux: number[] }>("GET", "/app/visites/lieux-qui-valident"),
    demanderAddition: (lieuId, position) => client.demander<{ visite: Visite }>("POST", "/app/visites/addition", { corps: { lieuId, position } }),
    validerComptoir: (texte, position) => client.demander<ResultatValidation>("POST", "/app/visites/comptoir", { corps: { texte, position } }),
    lireVisite: (id) => client.demander<ResultatValidation>("GET", `/app/visites/${id}`),
    annulerDemande: (id) => client.demander<{ visite: Visite }>("POST", `/app/visites/${id}/annuler`),
    contesterRefus: (id, mot) => client.demander<{ visite: Visite }>("POST", `/app/visites/${id}/contester`, { corps: { mot } }),
    listerVisites: () => client.demander<{ visites: Visite[]; enCours: Visite | null; points: number }>("GET", "/app/visites"),
    ecouter: creerEcouteReguliere(INTERVALLE_SUIVI_DEMANDE_MS),
  };
}
