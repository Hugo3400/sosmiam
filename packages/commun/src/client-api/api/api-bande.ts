// La bande, version API (routes /app/bande et /app/blocages ; contrat dans contrat-bande.ts). Le code d'invitation part
// dans le corps, jamais dans l'adresse (gardée par les journaux de nginx).

import type { ActiviteBandeApi, BandeApi, ClassementApi, InvitationBandeApi } from "../../types/bande.ts";
import type { PersonneResume } from "../../types/social.ts";
import type { ClientHttp } from "../client-http.ts";
import type { EtatDemandeBande, ServiceBande } from "../contrat-bande.ts";

export function creerBandeApi(client: ClientHttp): ServiceBande {
  /** Adresse d'une personne, par son identifiant public */
  const de = (debut: string, id: string) => `${debut}/${encodeURIComponent(id)}`;
  return {
    lireBande: () => client.demander<{ bande: BandeApi }>("GET", "/app/bande"),
    lireInvitation: () => client.demander<{ invitation: InvitationBandeApi }>("GET", "/app/bande/invitation"),
    renouvelerInvitation: () => client.demander<{ invitation: InvitationBandeApi }>("POST", "/app/bande/invitation/renouveler"),
    rejoindre: (pseudo, code, moyen) =>
      client.demander<{ personne: PersonneResume; deja: boolean }>("POST", "/app/bande/rejoindre", { corps: { pseudo, code, moyen } }),
    demander: (id) => client.demander<{ etat: EtatDemandeBande; personne?: PersonneResume }>("POST", "/app/bande/demandes", { corps: { personne: id } }),
    accepter: (id) => client.demander<{ personne: PersonneResume }>("POST", `${de("/app/bande/demandes", id)}/accepter`),
    retirerDemande: (id) => client.demander("DELETE", de("/app/bande/demandes", id)),
    retirer: (id) => client.demander("DELETE", de("/app/bande", id)),
    lireActivite: () => client.demander<{ activites: ActiviteBandeApi[] }>("GET", "/app/bande/activite"),
    lireClassement: () => client.demander<{ classement: ClassementApi }>("GET", "/app/bande/classement"),
    listerBloques: () => client.demander<{ bloques: PersonneResume[] }>("GET", "/app/blocages"),
    bloquer: (id, bloque) => client.demander(bloque ? "PUT" : "DELETE", de("/app/blocages", id)),
  };
}
