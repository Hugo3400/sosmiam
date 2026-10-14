// Les suivis entre personnes, version API (routes /app/suivis-personnes ; contrat dans contrat-suivis-personnes.ts).

import type { LienSuiviApi, PageLiensSuiviApi, ResumeSuivisApi } from "../../types/suivis.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceSuivisPersonnes } from "../contrat-suivis-personnes.ts";

/** « ?apres=<suite> » : la suite de la page d'avant, opaque, renvoyée telle quelle ; rien pour la première page */
const ecrireApres = (suite?: string) => (suite ? `?apres=${encodeURIComponent(suite)}` : "");

export function creerSuivisPersonnesApi(client: ClientHttp): ServiceSuivisPersonnes {
  const de = (debut: string, id: string) => `/app/suivis-personnes/${debut}/${encodeURIComponent(id)}`;
  return {
    lireResume: () => client.demander<{ suivis: ResumeSuivisApi }>("GET", "/app/suivis-personnes"),
    listerAbonnes: (apres) => client.demander<PageLiensSuiviApi>("GET", `/app/suivis-personnes/abonnes${ecrireApres(apres)}`),
    listerAbonnements: (apres) => client.demander<PageLiensSuiviApi>("GET", `/app/suivis-personnes/abonnements${ecrireApres(apres)}`),
    suivre: (id, suivi) => client.demander<{ etat?: "suivi" | "demande"; deja?: boolean }>(suivi ? "PUT" : "DELETE", de("abonnements", id)),
    repondreDemande: (id, accepte) =>
      accepte
        ? client.demander<{ lien?: LienSuiviApi }>("POST", `${de("demandes", id)}/accepter`)
        : client.demander<{ lien?: LienSuiviApi }>("DELETE", de("demandes", id)),
    retirerAbonne: (id) => client.demander("DELETE", de("abonnes", id)),
    changerConfidentialite: (prive) =>
      client.demander<{ prive: boolean; acceptees: number }>("PUT", "/app/suivis-personnes/confidentialite", { corps: { prive } }),
  };
}
