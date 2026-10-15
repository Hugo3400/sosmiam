import type { ChoixGenre, Genre } from "./genre.ts";
import type { LieuResume } from "./lieu-resume.ts";
import type { PersonneResume } from "./social.ts";

export type TrancheAge = "18-25" | "25-35" | "30-plus" | "40-plus";

export type PublicSortieMiamis =
  | { type: "tous" }
  | { type: "genre"; genre: Genre }
  | { type: "age"; tranche: TrancheAge }
  | { type: "nouveaux" }
  | { type: "ambassadeurs" };

export type TypePublicSortieMiamis = PublicSortieMiamis["type"];

export type ProfilVisibiliteMiamis = { genre: ChoixGenre | null; age: number | null; nouveau: boolean; ambassadeur: boolean };

export type EtiquetteSortieMiamis = { nom: string; officielle: boolean };

export type SortiesTenues = { tenues: number; prevues: number };

export type MaPlaceSortieMiamis = "organisateur" | "accepte" | "attente" | "demande" | "aucune";

export type ParticipantSortieMiamis = {
  personne: PersonneResume;
  habitue: boolean;
  dansTaBande: boolean;
  nouveau: boolean;
  present: boolean;
};

export type DemandeArriveeMiamis = {
  personne: PersonneResume;
  date: string;
  nouveau: boolean;
  sortiesTenues: SortiesTenues;
};

export type SortieMiamis = {
  id: string;
  titre: string;
  description: string;
  quand: string;
  lieu: LieuResume;
  organisateur: PersonneResume;
  sortiesTenuesOrganisateur: SortiesTenues;
  rescoussesOrganisateur: number;
  public: PublicSortieMiamis;
  etiquettes: EtiquetteSortieMiamis[];
  places: number;
  placeGardeePourNouveau: boolean;
  recurrente: boolean;
  habitues: number;
  participants: ParticipantSortieMiamis[];
  nombreEnAttente: number;
  listeAttente: PersonneResume[];
  demandes: DemandeArriveeMiamis[];
  conversationId: string | null;
  moi: { place: MaPlaceSortieMiamis; rangAttente: number | null; present: boolean };
};

export type NouvelleSortieMiamis = {
  titre: string;
  description: string;
  quand: string;
  lieuId: number;
  public: PublicSortieMiamis;
  etiquettes: EtiquetteSortieMiamis[];
  places: number;
  placeGardeePourNouveau: boolean;
  recurrente: boolean;
};
