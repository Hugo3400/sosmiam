// Les listes de lieux, version API (routes /app/listes ; contrat dans contrat-listes.ts). Une création porte sa clé
// « Idempotency-Key » dans l'en-tête : un second envoi avec la même clé rend la liste déjà créée.

import type { ListeApi, ListeResumeApi } from "../../types/listes.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceListes } from "../contrat-listes.ts";

type MesListes = { miennes: ListeResumeApi[]; coEcrites: ListeResumeApi[]; suivies: ListeResumeApi[]; invitations: ListeResumeApi[] };

export function creerListesApi(client: ClientHttp): ServiceListes {
  /** Adresse d'une liste, par son identifiant */
  const liste = (id: string) => `/app/listes/${encodeURIComponent(id)}`;
  return {
    listerMiennes: () => client.demander<MesListes>("GET", "/app/listes"),
    listerADecouvrir: (apres) =>
      client.demander<{ listes: ListeResumeApi[]; suite: string | null }>("GET", apres ? `/app/listes/a-decouvrir?apres=${encodeURIComponent(apres)}` : "/app/listes/a-decouvrir"),
    lire: (id) => client.demander<{ liste: ListeApi }>("GET", liste(id)),
    creer: (l, cle) => client.demander<{ liste: ListeApi }>("POST", "/app/listes", { corps: l, entetes: { "Idempotency-Key": cle } }),
    modifier: (id, m) => client.demander<{ liste: ListeApi }>("PATCH", liste(id), { corps: m }),
    supprimer: (id) => client.demander("DELETE", liste(id)),
    basculerLieu: (id, lieuId, oui) => client.demander<{ liste: ListeApi }>(oui ? "PUT" : "DELETE", `${liste(id)}/lieux/${lieuId}`),
    inviterCoAuteur: (id, personne) => client.demander<{ liste: ListeApi }>("POST", `${liste(id)}/co-auteurs`, { corps: { personne } }),
    accepterCoAuteur: (id) => client.demander<{ liste: ListeApi }>("POST", `${liste(id)}/co-auteurs/moi/accepter`),
    retirerCoAuteur: (id, personne) => client.demander("DELETE", `${liste(id)}/co-auteurs/${encodeURIComponent(personne)}`),
    suivre: (id, oui) => client.demander<{ liste: ListeApi }>(oui ? "PUT" : "DELETE", `${liste(id)}/abonnement`),
  };
}
