import type { IdeeDetailApi, QuiEstLaApi, SortieMiamisApi } from "../types/communaute.ts";
import type { ChoixGenre, GenreProfil } from "../types/genre.ts";
import type { CommentaireIdee, IdeeMiamis, NouvelleIdee } from "../types/idees.ts";
import type { CoucouMiami, EvenementMiamis } from "../types/qui-est-la.ts";
import type { NouvelleSortieMiamis } from "../types/sorties-miamis.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceCommunaute {
  listerSorties(): Promise<ReponseApi<{ sorties: SortieMiamisApi[] }>>;
  lireSortie(id: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  creerSortie(s: NouvelleSortieMiamis, cle: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  demanderAVenir(id: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  annulerDemande(id: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  quitterSortie(id: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  accepterArrivee(id: string, personne: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  refuserArrivee(id: string, personne: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  retirerParticipant(id: string, personne: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  validerPresence(id: string): Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;
  annulerSortie(id: string): Promise<ReponseApi>;

  lireGenre(): Promise<ReponseApi<{ genre: GenreProfil }>>;
  choisirGenre(choix: ChoixGenre): Promise<ReponseApi<{ genre: GenreProfil }>>;
  effacerGenre(): Promise<ReponseApi<{ genre: GenreProfil }>>;

  lireQuiEstLa(): Promise<ReponseApi<QuiEstLaApi>>;
  choisirVisibilite(visible: boolean): Promise<ReponseApi<{ visible: boolean; jusqua: string | null }>>;
  envoyerCoucou(personne: string): Promise<ReponseApi<{ coucou: CoucouMiami }>>;

  listerIdees(): Promise<ReponseApi<{ idees: IdeeMiamis[] }>>;
  lireIdee(id: string): Promise<ReponseApi<IdeeDetailApi>>;
  proposerIdee(idee: NouvelleIdee, cle: string): Promise<ReponseApi<{ idee: IdeeMiamis }>>;
  retirerIdee(id: string): Promise<ReponseApi>;
  voterIdee(id: string, oui: boolean): Promise<ReponseApi<{ idee: IdeeMiamis }>>;
  commenterIdee(id: string, texte: string, reponseA?: string | null): Promise<ReponseApi<{ commentaire: CommentaireIdee }>>;
  supprimerCommentaireIdee(commentaireId: string): Promise<ReponseApi>;
  aimerCommentaireIdee(commentaireId: string, oui: boolean): Promise<ReponseApi<{ commentaire: CommentaireIdee }>>;

  lireFil(): Promise<ReponseApi<{ evenements: EvenementMiamis[] }>>;
}
