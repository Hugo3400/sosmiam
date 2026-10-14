// Les commentaires des publications, version API (routes /app/commentaires ; contrat dans contrat-commentaires.ts). La
// liste d'une publication part sans session : elle est lisible en visite, et mise en cache public 30 s par le serveur.

import type { CommentaireApi, MesCommentairesApi } from "../../types/commentaires.ts";
import type { ClientHttp } from "../client-http.ts";
import type { PageCommentairesApi, ServiceCommentaires } from "../contrat-commentaires.ts";

export function creerCommentairesApi(client: ClientHttp): ServiceCommentaires {
  const publication = (id: string) => `/app/commentaires/publications/${encodeURIComponent(id)}`;
  const commentaire = (id: string) => `/app/commentaires/${encodeURIComponent(id)}`;
  return {
    lister: (publicationId, apres) =>
      client.demander<PageCommentairesApi>("GET", `${publication(publicationId)}${apres ? `?apres=${encodeURIComponent(apres)}` : ""}`, { session: false }),
    lireMiens: (publicationId) => client.demander<{ moi: MesCommentairesApi }>("GET", `${publication(publicationId)}/moi`),
    commenter: (publicationId, c) => client.demander<{ commentaire: CommentaireApi }>("POST", publication(publicationId), { corps: c }),
    modifier: (id, texte) => client.demander<{ commentaire: CommentaireApi }>("PATCH", commentaire(id), { corps: { texte } }),
    supprimer: (id) => client.demander("DELETE", commentaire(id)),
    aimer: (id, oui) => client.demander<{ jaimes: number }>(oui ? "PUT" : "DELETE", `${commentaire(id)}/jaime`),
    masquerCommeLieu: (id, masque) => client.demander(masque ? "PUT" : "DELETE", `${commentaire(id)}/masque`),
  };
}
