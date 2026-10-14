// Contrat des listes de lieux (compte connecté), mêmes routes que l'API (/app/listes). L'auteur remplit sa liste et
// choisit qui la voit (« tous » ou sa « bande ») ; il peut inviter des potes de sa bande à la remplir avec lui (co-auteurs) ;
// les autres la suivent. Une liste qu'on ne voit pas répond toujours « liste-inconnue ».

import type { ListeApi, ListeResumeApi, NouvelleListe } from "../types/listes.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceListes {
  /** Tes listes, celles que tu remplis avec d'autres, celles que tu suis, et les invitations à remplir (à accepter) */
  listerMiennes(): Promise<ReponseApi<{ miennes: ListeResumeApi[]; coEcrites: ListeResumeApi[]; suivies: ListeResumeApi[]; invitations: ListeResumeApi[] }>>;
  /** Les listes visibles de ta bande et des personnes que tu suis, 20 par page ; apres : la `suite` de la page d'avant */
  listerADecouvrir(apres?: string): Promise<ReponseApi<{ listes: ListeResumeApi[]; suite: string | null }>>;
  lire(id: string): Promise<ReponseApi<{ liste: ListeApi }>>;
  /** cle : Idempotency-Key tirée à l'ouverture de la feuille (un second envoi rend la liste déjà créée) */
  creer(l: NouvelleListe, cle: string): Promise<ReponseApi<{ liste: ListeApi }>>;
  modifier(id: string, m: Partial<NouvelleListe>): Promise<ReponseApi<{ liste: ListeApi }>>;
  supprimer(id: string): Promise<ReponseApi>;
  /** Ajouter (oui) ou retirer un lieu : l'auteur, ou un co-auteur qui a accepté */
  basculerLieu(id: string, lieuId: number, oui: boolean): Promise<ReponseApi<{ liste: ListeApi }>>;
  /** L'auteur invite un pote de sa bande (identifiant public) à remplir la liste */
  inviterCoAuteur(id: string, personne: string): Promise<ReponseApi<{ liste: ListeApi }>>;
  accepterCoAuteur(id: string): Promise<ReponseApi<{ liste: ListeApi }>>;
  /** "moi" : refuser l'invitation (sans prévenir) ou ne plus remplir la liste ; sinon l'auteur retire ce co-auteur */
  retirerCoAuteur(id: string, personne: string | "moi"): Promise<ReponseApi>;
  /** Suivre (oui) ou ne plus suivre la liste */
  suivre(id: string, oui: boolean): Promise<ReponseApi<{ liste: ListeApi }>>;
}
