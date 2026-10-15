import type { IdeeDetailApi, QuiEstLaApi, SortieMiamisApi } from "../../types/communaute.ts";
import type { GenreProfil } from "../../types/genre.ts";
import type { CommentaireIdee, IdeeMiamis } from "../../types/idees.ts";
import type { CoucouMiami, EvenementMiamis } from "../../types/qui-est-la.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceCommunaute } from "../contrat-communaute.ts";

const RACINE = "/app/communaute";

export function creerCommunauteApi(client: ClientHttp): ServiceCommunaute {
  const sortie = (id: string) => `${RACINE}/sorties/${encodeURIComponent(id)}`;
  const idee = (id: string) => `${RACINE}/idees/${encodeURIComponent(id)}`;
  const commentaire = (id: string) => `${RACINE}/commentaires-idees/${encodeURIComponent(id)}`;
  const personne = (id: string) => encodeURIComponent(id);
  type UneSortie = { sortie: SortieMiamisApi };
  return {
    listerSorties: () => client.demander<{ sorties: SortieMiamisApi[] }>("GET", `${RACINE}/sorties`),
    lireSortie: (id) => client.demander<UneSortie>("GET", sortie(id)),
    creerSortie: (s, cle) => client.demander<UneSortie>("POST", `${RACINE}/sorties`, { corps: s, entetes: { "Idempotency-Key": cle } }),
    demanderAVenir: (id) => client.demander<UneSortie>("POST", `${sortie(id)}/demande`),
    annulerDemande: (id) => client.demander<UneSortie>("DELETE", `${sortie(id)}/demande`),
    quitterSortie: (id) => client.demander<UneSortie>("DELETE", `${sortie(id)}/participation`),
    accepterArrivee: (id, p) => client.demander<UneSortie>("POST", `${sortie(id)}/demandes/${personne(p)}`),
    refuserArrivee: (id, p) => client.demander<UneSortie>("DELETE", `${sortie(id)}/demandes/${personne(p)}`),
    retirerParticipant: (id, p) => client.demander<UneSortie>("DELETE", `${sortie(id)}/participants/${personne(p)}`),
    validerPresence: (id) => client.demander<UneSortie>("POST", `${sortie(id)}/presence`),
    annulerSortie: (id) => client.demander("DELETE", sortie(id)),

    lireGenre: () => client.demander<{ genre: GenreProfil }>("GET", `${RACINE}/genre`),
    choisirGenre: (choix) => client.demander<{ genre: GenreProfil }>("PUT", `${RACINE}/genre`, { corps: { choix } }),
    effacerGenre: () => client.demander<{ genre: GenreProfil }>("DELETE", `${RACINE}/genre`),

    lireQuiEstLa: () => client.demander<QuiEstLaApi>("GET", `${RACINE}/qui-est-la`),
    choisirVisibilite: (visible) => client.demander<{ visible: boolean; jusqua: string | null }>("PUT", `${RACINE}/qui-est-la`, { corps: { visible } }),
    envoyerCoucou: (p) => client.demander<{ coucou: CoucouMiami }>("POST", `${RACINE}/coucous/${personne(p)}`),

    listerIdees: () => client.demander<{ idees: IdeeMiamis[] }>("GET", `${RACINE}/idees`),
    lireIdee: (id) => client.demander<IdeeDetailApi>("GET", idee(id)),
    proposerIdee: (nouvelle, cle) => client.demander<{ idee: IdeeMiamis }>("POST", `${RACINE}/idees`, { corps: nouvelle, entetes: { "Idempotency-Key": cle } }),
    retirerIdee: (id) => client.demander("DELETE", idee(id)),
    voterIdee: (id, oui) => client.demander<{ idee: IdeeMiamis }>(oui ? "PUT" : "DELETE", `${idee(id)}/vote`),
    commenterIdee: (id, texte, reponseA) => client.demander<{ commentaire: CommentaireIdee }>("POST", `${idee(id)}/commentaires`, { corps: { texte, reponseA: reponseA ?? null } }),
    supprimerCommentaireIdee: (id) => client.demander("DELETE", commentaire(id)),
    aimerCommentaireIdee: (id, oui) => client.demander<{ commentaire: CommentaireIdee }>(oui ? "PUT" : "DELETE", `${commentaire(id)}/jaime`),

    lireFil: () => client.demander<{ evenements: EvenementMiamis[] }>("GET", `${RACINE}/fil`),
  };
}
