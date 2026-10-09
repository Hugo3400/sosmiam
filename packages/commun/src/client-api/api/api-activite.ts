// L'activité du compte dans l'app, version API (routes /app/activite, contrat dans apps/api/src/routes/activite.ts).

import type { ActiviteApi } from "../../types/activite.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ReponseActivite, ServiceActivite } from "../contrat-activite.ts";

export function creerActiviteApi(client: ClientHttp): ServiceActivite {
  /** PUT pour mettre, DELETE pour retirer */
  const basculer = (chemin: string, oui: boolean): Promise<ReponseActivite> => client.demander<{ activite: ActiviteApi }>(oui ? "PUT" : "DELETE", chemin);
  return {
    lireActivite: () => client.demander<{ activite: ActiviteApi }>("GET", "/app/activite"),
    donnerRescousse: (lieuId) => client.demander<{ activite: ActiviteApi; premierSauveteur: boolean }>("POST", "/app/activite/rescousses", { corps: { lieuId } }),
    reprendreRescousse: (lieuId) => client.demander<{ activite: ActiviteApi }>("DELETE", `/app/activite/rescousses/${lieuId}`),
    garder: (lieuId, garde) => basculer(`/app/activite/gardes/${lieuId}`, garde),
    aimer: (publicationId, aime) => basculer(`/app/activite/jaimes/${encodeURIComponent(publicationId)}`, aime),
    masquer: (publicationId, masquee) => basculer(`/app/activite/masques/${encodeURIComponent(publicationId)}`, masquee),
    suivre(cle, suivi) {
      // « lieu:12 » → /suivis/lieux/12 ; « createur:lea.mange » → /suivis/createurs/lea.mange
      const [type, cible] = cle.split(":", 2);
      return basculer(`/app/activite/suivis/${type === "lieu" ? "lieux" : "createurs"}/${encodeURIComponent(cible ?? "")}`, suivi);
    },
  };
}
