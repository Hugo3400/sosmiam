// La messagerie, version API (routes /app/conversations et /app/lieux-envoyes ; contrat dans contrat-messagerie.ts). Rien de
// personnel dans les adresses : un message, un titre ou un mot partent toujours dans le corps ; une photo ou une note
// vocale en corps brut, avec leur idClient dans l'en-tête Idempotency-Key.

import type { CodeReaction, ConversationApi, LieuEnvoyeApi, MessageApi, PageConversationsApi, PagePartagesApi } from "../../types/messagerie.ts";
import type { ClientHttp } from "../client-http.ts";
import type { PageLieuxEnvoyes, ReponseFil, ServiceMessagerie } from "../contrat-messagerie.ts";

/** « ?apres=<suite> » : la suite de la page d'avant, opaque, renvoyée telle quelle ; rien pour la première page */
const ecrireApres = (suite?: string) => (suite ? `?apres=${encodeURIComponent(suite)}` : "");

export function creerMessagerieApi(client: ClientHttp): ServiceMessagerie {
  const conversation = (id: string) => `/app/conversations/${encodeURIComponent(id)}`;
  const message = (id: string, messageId: string) => `${conversation(id)}/messages/${encodeURIComponent(messageId)}`;
  type AvecMessage = { message: MessageApi; version: number };
  return {
    listerConversations: (apres) => client.demander<PageConversationsApi>("GET", `/app/conversations${ecrireApres(apres)}`),
    lireFil: (id, o = {}) => {
      const parametres = new URLSearchParams();
      if (o.version !== undefined) parametres.set("version", String(o.version));
      if (o.avant !== undefined) parametres.set("avant", o.avant);
      const requete = parametres.toString();
      return client.demander("GET", `${conversation(id)}${requete ? `?${requete}` : ""}`) as Promise<ReponseFil>;
    },
    ouvrirPrive: (personne) => client.demander<{ conversation: ConversationApi }>("POST", "/app/conversations/prive", { corps: { personne } }),
    creerGroupe: (g, cle) =>
      client.demander<{ conversation: ConversationApi; ignores: string[] }>("POST", "/app/conversations/groupes", { corps: g, entetes: { "Idempotency-Key": cle } }),
    modifierGroupe: (id, m) => client.demander<{ conversation: ConversationApi }>("PATCH", conversation(id), { corps: m }),
    inviterAuGroupe: (id, invites) => client.demander<{ conversation: ConversationApi; ignores: string[] }>("POST", `${conversation(id)}/invites`, { corps: { invites } }),
    repondreInvitation: (id, rejoint) => client.demander<{ rejoint: boolean; conversation?: ConversationApi }>("POST", `${conversation(id)}/reponse`, { corps: { rejoint } }),
    retirerMembre: (id, personne) => client.demander("DELETE", `${conversation(id)}/membres/${encodeURIComponent(personne)}`),
    changerRole: (id, personne, role) =>
      client.demander<{ conversation: ConversationApi }>("PUT", `${conversation(id)}/membres/${encodeURIComponent(personne)}/role`, { corps: { role } }),
    couper: (id, coupees) => client.demander("PUT", `${conversation(id)}/notifications`, { corps: { coupees } }),
    marquerLu: (id, jusqua) => client.demander("PUT", `${conversation(id)}/lu`, { corps: { jusqua } }),
    effacerPourMoi: (id) => client.demander("POST", `${conversation(id)}/effacer`),
    envoyerTexte: (id, idClient, texte, o = {}) =>
      client.demander<AvecMessage>("POST", `${conversation(id)}/messages`, { corps: { idClient, type: "texte", texte, ...(o.reponseA !== undefined ? { reponseA: o.reponseA } : {}) } }),
    modifierMessage: (id, messageId, texte) => client.demander<AvecMessage>("PATCH", message(id, messageId), { corps: { texte } }),
    envoyerLieu: (id, idClient, lieuId, texte) =>
      client.demander<AvecMessage>("POST", `${conversation(id)}/messages`, { corps: { idClient, type: "lieu", lieuId, texte: texte ?? null } }),
    envoyerMedia: (id, idClient, corps, typeMime, o = {}) =>
      client.envoyerOctets<AvecMessage>(`${conversation(id)}/medias`, corps, typeMime, {
        "Idempotency-Key": idClient,
        ...(o.album !== undefined ? { "X-Album": o.album } : {}),
        ...(o.legende ? { "X-Legende": encodeURIComponent(o.legende) } : {}),
        ...(o.onde !== undefined ? { "X-Onde": o.onde } : {}),
      }),
    preparerLectureMedia: (id, messageId) => client.preparerTelechargement(`${message(id, messageId)}/media`),
    supprimerMessage: (id, messageId) => client.demander<{ version: number }>("DELETE", message(id, messageId)),
    reagir: (id, messageId, reaction: CodeReaction, oui) =>
      client.demander<{ version: number }>(oui ? "PUT" : "DELETE", `${message(id, messageId)}/reactions/${encodeURIComponent(reaction)}`),
    epingler: (id, epinglee) => client.demander("PUT", `${conversation(id)}/epingle`, { corps: { epinglee } }),
    envoyerPhotoGroupe: (id, corps) => client.envoyerOctets<{ conversation: ConversationApi }>(`${conversation(id)}/photo`, corps, "image/jpeg", {}, "PUT"),
    retirerPhotoGroupe: (id) => client.demander<{ conversation: ConversationApi }>("DELETE", `${conversation(id)}/photo`),
    preparerLecturePhotoGroupe: (id) => client.preparerTelechargement(`${conversation(id)}/photo`),
    listerPartages: (id, type, avant) => {
      const parametres = new URLSearchParams({ type });
      if (avant !== undefined) parametres.set("avant", avant);
      return client.demander<PagePartagesApi>("GET", `${conversation(id)}/partages?${parametres.toString()}`);
    },
    envoyerLieuAPotes: (idClient, lieuId, a, mot) =>
      client.demander<{ envoyes: LieuEnvoyeApi[]; ignores: string[] }>("POST", "/app/lieux-envoyes", { corps: { idClient, lieuId, a, mot: mot ?? null } }),
    listerLieuxRecus: (apres) => client.demander<PageLieuxEnvoyes>("GET", `/app/lieux-envoyes/recus${ecrireApres(apres)}`),
    listerLieuxEnvoyes: (apres) => client.demander<PageLieuxEnvoyes>("GET", `/app/lieux-envoyes/envoyes${ecrireApres(apres)}`),
    marquerLieuxVus: (jusqua) => client.demander("PUT", "/app/lieux-envoyes/vus", { corps: { jusqua } }),
  };
}
