import type { IdeeDetailApi, QuiEstLaApi, SortieMiamisApi } from "../../../../packages/commun/src/types/communaute.ts";
import type { ChoixGenre, GenreProfil } from "../../../../packages/commun/src/types/genre.ts";
import type { CommentaireIdee, IdeeMiamis, NouvelleIdee, StatutIdee } from "../../../../packages/commun/src/types/idees.ts";
import type { CoucouMiami, EvenementMiamis } from "../../../../packages/commun/src/types/qui-est-la.ts";
import type { NouvelleSortieMiamis } from "../../../../packages/commun/src/types/sorties-miamis.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import type { ChiffrementGenre } from "./chiffrement-communaute.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import type { ServicesLimitations } from "./limitations-comptes-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";

export type StatutParticipationMiamis = "organise" | "demande" | "accepte" | "attente" | "invite" | "refuse" | "renonce" | "desiste";

export type LigneSortieMiamis = {
  id: number;
  organisateurId: number;
  lieuId: number;
  conversationId: number | null;
  titre: string;
  description: string;
  quand: Date;
  villeCle: string;
  publicType: string;
  publicValeur: string | null;
  places: number;
  placeGardeeNouveau: boolean;
  recurrente: boolean;
  serieId: number | null;
  suiteTraiteeLe: Date | null;
  rappelEnvoyeLe: Date | null;
  annuleeLe: Date | null;
  annulationTardive: boolean;
  retireeLe: Date | null;
  version: number;
  creeLe: Date;
  etiquettes: { nom: string; officielle: boolean }[];
};

export type LigneParticipationMiamis = {
  sortieId: number;
  compteId: number;
  statut: StatutParticipationMiamis;
  habitue: boolean;
  creeLe: Date;
  decideLe: Date | null;
  presentLe: Date | null;
};

export type LieuSortieMiamis = { id: number; nom: string; emoji: string; type: string; ville: string; publie: boolean };

export type CompteCommunaute = {
  id: number;
  creeLe: Date;
  ville: string | null;
  dateNaissanceChiffree: string | null;
  ambassadeurActif: boolean;
  activitePartagee: boolean;
};

export type ProfilCommunauteLu = { genreChiffre: string | null; genreChoisiLe: Date | null; quiEstLa: boolean };

export type HistoriqueSortieMiamis = { compteId: number; statut: StatutParticipationMiamis; quand: Date; annulee: boolean; annulationTardive: boolean; autresAcceptes: number };

export type NouvelleLigneSortieMiamis = Omit<LigneSortieMiamis, "id" | "suiteTraiteeLe" | "rappelEnvoyeLe" | "annuleeLe" | "annulationTardive" | "retireeLe" | "version" | "creeLe">;

export type ChangementSortieMiamis = Partial<Pick<LigneSortieMiamis, "conversationId" | "suiteTraiteeLe" | "rappelEnvoyeLe" | "annuleeLe" | "annulationTardive">>;

export type LigneIdee = {
  id: number;
  auteurId: number | null;
  titre: string;
  detail: string;
  statut: StatutIdee;
  reponseBrigade: string | null;
  reponduLe: Date | null;
  ideeDuMois: string | null;
  publieeLe: Date | null;
  suspendueLe: Date | null;
  retireeLe: Date | null;
  creeLe: Date;
  votes: number;
  aVote: boolean;
  commentaires: number;
};

export type LigneCommentaireIdee = {
  id: number;
  ideeId: number;
  auteurId: number;
  texte: string;
  reponseAId: number | null;
  masqueLe: Date | null;
  suspenduLe: Date | null;
  retireLe: Date | null;
  creeLe: Date;
  jaimes: number;
  aime: boolean;
};

export type ActiviteRecente = {
  idees: { id: number; auteurId: number | null; titre: string; publieeLe: Date }[];
  reponses: { id: number; titre: string; reponduLe: Date }[];
  votes: { compteId: number; nombre: number; dernier: Date }[];
  sorties: LigneSortieMiamis[];
  arrivees: { sortieId: number; compteId: number; decideLe: Date }[];
};

export interface TablesCommunaute {
  verrouillerComptes(compteIds: readonly number[]): Promise<void>;
  verrouillerSortie(id: number): Promise<LigneSortieMiamis | null>;
  bloqueEntre(a: number, b: number): Promise<boolean>;
  listerPairesBloquees(ids: readonly number[]): Promise<[number, number][]>;
  lireIdempotence(compteId: number, cle: string, ressource: "miamis" | "idee"): Promise<number | null>;
  noterIdempotence(compteId: number, cle: string, ressource: "miamis" | "idee", ressourceId: number, maintenant: Date): Promise<boolean>;
  lireSorties(ids: readonly number[]): Promise<LigneSortieMiamis[]>;
  listerSortiesVille(villeCle: string, apres: Date, nombre: number): Promise<LigneSortieMiamis[]>;
  listerSortiesDe(compteId: number, apres: Date, nombre: number): Promise<LigneSortieMiamis[]>;
  lireParticipations(sortieIds: readonly number[]): Promise<LigneParticipationMiamis[]>;
  compterSortiesAVenir(organisateurId: number, maintenant: Date): Promise<number>;
  creerSortie(s: NouvelleLigneSortieMiamis, maintenant: Date): Promise<number>;
  changerSortie(id: number, changement: ChangementSortieMiamis, maintenant: Date): Promise<void>;
  ecrireParticipation(p: Omit<LigneParticipationMiamis, "presentLe"> & { presentLe?: Date | null }): Promise<void>;
  effacerParticipation(sortieId: number, compteId: number): Promise<void>;
  lireLieux(ids: readonly number[]): Promise<Map<number, LieuSortieMiamis>>;
  lireComptes(ids: readonly number[]): Promise<Map<number, CompteCommunaute>>;
  compterRescousses(ids: readonly number[]): Promise<Map<number, number>>;
  lireHistoriques(ids: readonly number[], maintenant: Date): Promise<HistoriqueSortieMiamis[]>;
  aUneVisiteValidee(compteId: number, lieuId: number, de: Date, a: Date): Promise<boolean>;
  creerConversation(organisateurId: number, maintenant: Date): Promise<number>;
  ajouterMembre(conversationId: number, compteId: number, maintenant: Date): Promise<void>;
  retirerMembre(conversationId: number, compteId: number, maintenant: Date): Promise<void>;
  effacerConversation(conversationId: number): Promise<() => Promise<void>>;
  listerSortiesARappeler(maintenant: Date, jusqua: Date, nombre: number): Promise<LigneSortieMiamis[]>;
  listerSortiesAContinuer(avant: Date, nombre: number): Promise<LigneSortieMiamis[]>;

  lireProfil(compteId: number): Promise<ProfilCommunauteLu | null>;
  ecrireProfil(compteId: number, changement: Partial<ProfilCommunauteLu>, maintenant: Date): Promise<void>;
  lireGenresChiffres(ids: readonly number[]): Promise<Map<number, string>>;
  lirePresence(compteId: number): Promise<{ villeCle: string; jusqua: Date } | null>;
  ecrirePresence(compteId: number, villeCle: string, jusqua: Date): Promise<void>;
  effacerPresence(compteId: number): Promise<void>;
  listerPresents(villeCle: string, maintenant: Date, nombre: number): Promise<number[]>;
  lireCoucous(moi: number, depuis: Date): Promise<{ envoyes: Set<number>; recus: Set<number> }>;
  ecrireCoucou(de: number, a: number, maintenant: Date): Promise<void>;
  effacerCoucous(compteId: number): Promise<void>;

  listerIdees(moi: number, nombre: number): Promise<LigneIdee[]>;
  lireIdee(id: number, moi: number): Promise<LigneIdee | null>;
  trouverIdeeParCle(titreCle: string): Promise<number | null>;
  creerIdee(auteurId: number, idee: NouvelleIdee, titreCle: string, maintenant: Date): Promise<number>;
  effacerIdee(id: number): Promise<void>;
  voterIdee(ideeId: number, compteId: number, oui: boolean, maintenant: Date): Promise<void>;
  listerVotantsRecents(ideeId: number, nombre: number): Promise<number[]>;
  listerCommentaires(ideeId: number, moi: number, nombre: number): Promise<LigneCommentaireIdee[]>;
  lireCommentaire(id: number, moi: number): Promise<LigneCommentaireIdee | null>;
  creerCommentaire(ideeId: number, auteurId: number, texte: string, reponseAId: number | null, maintenant: Date): Promise<number>;
  effacerCommentaire(id: number): Promise<void>;
  aimerCommentaire(commentaireId: number, compteId: number, oui: boolean, maintenant: Date): Promise<void>;
  lireActiviteRecente(villeCle: string | null, depuis: Date, nombre: number): Promise<ActiviteRecente>;
}

export type DepotCommunaute = {
  lire<T>(fn: (t: TablesCommunaute) => Promise<T>): Promise<T>;
  ecrire<T>(fn: (t: TablesCommunaute) => Promise<T>): Promise<T>;
};

export type RefusCommunaute =
  | "sortie-inconnue" | "sortie-passee" | "reserve-a-l-organisateur" | "personne-inconnue" | "demande-inconnue" | "lieu-inconnu"
  | "public-reserve" | "trop-de-sorties-miamis" | "presence-non-validee" | "presence-fermee" | "genre-trop-tot" | "invisible-ici"
  | "ville-requise" | "idee-proche" | "idee-inconnue" | "idee-en-relecture" | "reserve-a-l-auteur" | "commentaire-inconnu"
  | "chiffrement-indisponible" | "cle-deja-prise";

export type Refus = { ok: false; erreur: RefusCommunaute; jusqua?: Date };
export type Reussite<T> = { ok: true; effets: EffetSocial[] } & T;
export type Resultat<T extends object = Record<never, never>> = Reussite<T> | Refus;

export type ContexteCommunaute = {
  depot: DepotCommunaute;
  relations: RelationsSociales;
  chiffrementDonnees: ChiffrementDonnees | null;
  genre: ChiffrementGenre | null;
  estLimite?: ServicesLimitations["estLimite"];
};

export interface ServicesSortiesMiamis {
  lister(moi: number, maintenant: Date): Promise<SortieMiamisApi[]>;
  lire(moi: number, id: number, maintenant: Date): Promise<SortieMiamisApi | null>;
  creer(moi: number, s: NouvelleSortieMiamis, cle: string, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi; cree: boolean }>>;
  demander(moi: number, id: number, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi }>>;
  annulerDemande(moi: number, id: number, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi }>>;
  quitter(moi: number, id: number, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi }>>;
  accepter(moi: number, id: number, personne: number | null, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi }>>;
  refuser(moi: number, id: number, personne: number | null, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi }>>;
  retirer(moi: number, id: number, personne: number | null, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi }>>;
  validerPresence(moi: number, id: number, maintenant: Date): Promise<Resultat<{ sortie: SortieMiamisApi }>>;
  annuler(moi: number, id: number, maintenant: Date): Promise<Resultat>;
  passerTaches(maintenant: Date): Promise<{ rappels: number; suites: number; echecs: number; effets: EffetSocial[] }>;
}

export interface ServicesGenre {
  lire(moi: number): Promise<Resultat<{ genre: GenreProfil }>>;
  choisir(moi: number, choix: ChoixGenre, maintenant: Date): Promise<Resultat<{ genre: GenreProfil }>>;
  effacer(moi: number, maintenant: Date): Promise<Resultat<{ genre: GenreProfil }>>;
}

export interface ServicesQuiEstLa {
  lire(moi: number, maintenant: Date): Promise<QuiEstLaApi>;
  montrer(moi: number, maintenant: Date): Promise<Resultat<{ visible: boolean; jusqua: string | null }>>;
  cacher(moi: number, maintenant: Date): Promise<Resultat<{ visible: boolean; jusqua: string | null }>>;
  faireCoucou(moi: number, personne: number | null, maintenant: Date): Promise<Resultat<{ coucou: CoucouMiami }>>;
}

export interface ServicesIdees {
  lister(moi: number): Promise<IdeeMiamis[]>;
  lire(moi: number, id: number): Promise<IdeeDetailApi | null>;
  proposer(moi: number, idee: NouvelleIdee, cle: string, maintenant: Date): Promise<Resultat<{ idee: IdeeMiamis; cree: boolean }>>;
  retirer(moi: number, id: number): Promise<Resultat>;
  voter(moi: number, id: number, oui: boolean, maintenant: Date): Promise<Resultat<{ idee: IdeeMiamis }>>;
  commenter(moi: number, id: number, texte: string, reponseA: number | null, maintenant: Date): Promise<Resultat<{ commentaire: CommentaireIdee }>>;
  supprimerCommentaire(moi: number, commentaireId: number): Promise<Resultat>;
  aimerCommentaire(moi: number, commentaireId: number, oui: boolean, maintenant: Date): Promise<Resultat<{ commentaire: CommentaireIdee }>>;
}

export type ServicesCommunaute = {
  sorties: ServicesSortiesMiamis;
  genre: ServicesGenre;
  quiEstLa: ServicesQuiEstLa;
  idees: ServicesIdees;
  fil: { lire(moi: number, maintenant: Date): Promise<EvenementMiamis[]> };
};

export const refus = (erreur: RefusCommunaute, jusqua?: Date): Refus => (jusqua ? { ok: false, erreur, jusqua } : { ok: false, erreur });
