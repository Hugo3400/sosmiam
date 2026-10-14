// Les sorties, version API (routes /app/sorties ; contrat dans contrat-sorties.ts). Une création porte sa clé
// « Idempotency-Key » dans l'en-tête : un second envoi avec la même clé rend la sortie déjà créée.

import type { InvitationSortieApi, SortieApi } from "../../types/sorties.ts";
import type { ClientHttp } from "../client-http.ts";
import type { LectureSortieApi, ServiceSorties } from "../contrat-sorties.ts";

export function creerSortiesApi(client: ClientHttp): ServiceSorties {
  /** Adresse d'une sortie, par son identifiant */
  const sortie = (id: string) => `/app/sorties/${encodeURIComponent(id)}`;
  return {
    lister: () => client.demander<{ sorties: SortieApi[]; invitations: InvitationSortieApi[] }>("GET", "/app/sorties"),
    lire: (id, version) => client.demander<LectureSortieApi>("GET", version === undefined ? sortie(id) : `${sortie(id)}?version=${version}`),
    creer: (s, cle) => client.demander<{ sortie: SortieApi }>("POST", "/app/sorties", { corps: s, entetes: { "Idempotency-Key": cle } }),
    repondre: (id, vient) => client.demander<{ sortie?: SortieApi }>("POST", `${sortie(id)}/reponse`, { corps: { vient } }),
    inviter: (id, invites) => client.demander<{ sortie: SortieApi }>("POST", `${sortie(id)}/invites`, { corps: { invites } }),
    proposer: (id, lieuId) => client.demander<{ sortie: SortieApi; deja?: boolean }>("POST", `${sortie(id)}/propositions`, { corps: { lieuId } }),
    voter: (id, lieuId, oui) => client.demander<{ sortie: SortieApi }>(oui ? "PUT" : "DELETE", `${sortie(id)}/votes/${lieuId}`),
    terminerVote: (id) => client.demander<{ sortie: SortieApi }>("POST", `${sortie(id)}/terminer-vote`),
    quitter: (id) => client.demander("DELETE", `${sortie(id)}/participation`),
    retirerParticipant: (id, personne) => client.demander("DELETE", `${sortie(id)}/participants/${encodeURIComponent(personne)}`),
    annuler: (id) => client.demander("DELETE", sortie(id)),
  };
}
