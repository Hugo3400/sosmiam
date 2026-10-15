import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ChoixGenre, GenreProfil } from "@sos-miam/commun/types/genre";
import type { CommentaireIdee, IdeeMiamis, NouvelleIdee } from "@sos-miam/commun/types/idees";
import type { CoucouMiami, EvenementMiamis, MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import type { NouvelleSortieMiamis, SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";

export type QuiEstLaApi = { ville: string | null; visible: boolean; total: number; presents: MiamiPresent[] };

export interface ServiceCommunauteAttendu {
  listerSorties(): Promise<ReponseApi<{ sorties: SortieMiamis[] }>>;
  lireSortie(id: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  creerSortie(sortie: NouvelleSortieMiamis, cle: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  demanderAVenir(id: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  annulerDemande(id: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  quitterSortie(id: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  accepterArrivee(id: string, personneId: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  refuserArrivee(id: string, personneId: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  validerPresence(id: string, code: string): Promise<ReponseApi<{ sortie: SortieMiamis }>>;
  annulerSortie(id: string): Promise<ReponseApi>;
  lireGenre(): Promise<ReponseApi<{ genre: GenreProfil }>>;
  choisirGenre(choix: ChoixGenre): Promise<ReponseApi<{ genre: GenreProfil }>>;
  modifierEnvies(envies: string[]): Promise<ReponseApi>;
  lireQuiEstLa(): Promise<ReponseApi<QuiEstLaApi>>;
  choisirVisibilite(visible: boolean): Promise<ReponseApi<{ visible: boolean }>>;
  envoyerCoucou(personneId: string): Promise<ReponseApi<{ coucou: CoucouMiami }>>;
  listerIdees(): Promise<ReponseApi<{ idees: IdeeMiamis[] }>>;
  lireIdee(id: string): Promise<ReponseApi<{ idee: IdeeMiamis; commentaires: CommentaireIdee[] }>>;
  proposerIdee(idee: NouvelleIdee, cle: string): Promise<ReponseApi<{ idee: IdeeMiamis }>>;
  voterIdee(id: string, oui: boolean): Promise<ReponseApi<{ idee: IdeeMiamis }>>;
  commenterIdee(id: string, texte: string, reponseA: string | null): Promise<ReponseApi<{ commentaire: CommentaireIdee }>>;
  aimerCommentaireIdee(commentaireId: string, oui: boolean): Promise<ReponseApi<{ commentaire: CommentaireIdee }>>;
  lireFil(): Promise<ReponseApi<{ evenements: EvenementMiamis[] }>>;
}
