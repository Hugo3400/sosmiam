// L'espace communauté tel que l'API le rend (routes /app/communaute, décision de Hugo des 14 et 15 octobre 2026) : sorties
// des Miamis, « Qui est là ? », mon genre, boîte à idées et « Ça bouge chez les Miamis ». Les formes de base viennent des
// écrans (sorties-miamis.ts, idees.ts, qui-est-la.ts, genre.ts) ; ce fichier n'ajoute que ce que l'API y met de plus.
import type { CommentaireIdee, IdeeMiamis } from "./idees.ts";
import type { MiamiPresent } from "./qui-est-la.ts";
import type { SortieMiamis } from "./sorties-miamis.ts";

/** Une sortie des Miamis lue par l'API : version (relecture « inchangé »), et l'invitation des habitués qui t'attend */
export type SortieMiamisApi = SortieMiamis & {
  version: number;
  /** Habitué de la semaine passée : ta place est gardée jusqu'à cette date, « Je viens » te fait entrer sans attendre */
  invitationHabitue: { jusqua: string } | null;
};

/** GET /app/communaute/sorties/:id : la sortie, ou rien de neuf depuis ta version */
export type LectureSortieMiamisApi = { sortie: SortieMiamisApi } | { inchange: true; version: number };

/** GET /app/communaute/sorties : celles de ta ville que tu peux voir (à venir), et les tiennes (organisées, demandées…) */
export type SortiesMiamisApi = { sorties: SortieMiamisApi[]; miennes: SortieMiamisApi[] };

/**
 * Une personne dans « Qui est là ? » : seulement son pseudo et son avatar (décision du 14 octobre 2026), plus ce qui te
 * lie à elle (ta bande, vos coucous) et la sortie des Miamis qu'elle organise, si tu peux la voir
 */
export type MiamiPresentApi = Pick<MiamiPresent, "personne" | "dansTaBande" | "coucou" | "organise">;

export type QuiEstLaApi = {
  /** Tu t'y montres (réglage « Me montrer ici ») */
  visible: boolean;
  /** La ville de ton profil ; null : pas de ville, personne à montrer */
  ville: string | null;
  /** Ta présence s'efface toute seule à cette date (null : tu n'y es pas) */
  jusqua: string | null;
  /** Les Miamis de ta ville qui s'y montrent en ce moment (toi exclu·e, blocages exclus) */
  nombre: number;
  miamis: MiamiPresentApi[];
};

export type TriIdees = "top" | "nouvelles" | "prevues" | "faites";

export type IdeesApi = { idees: IdeeMiamis[]; ideeDuMois: IdeeMiamis | null };

export type IdeeDetailApi = { idee: IdeeMiamis; commentaires: CommentaireIdee[] };

/** Les notifications de la cloche de l'espace communauté (detail : le titre de la sortie ou de l'idée) */
export type TypeClocheCommunaute =
  | "demande-sortie-miamis"
  | "arrivee-acceptee"
  | "liste-attente-miamis"
  | "place-liberee-miamis"
  | "rappel-sortie-miamis"
  | "sortie-miamis-annulee"
  | "invitation-habitue"
  | "coucou-reciproque"
  | "idee-publiee"
  | "reponse-brigade"
  | "idee-du-mois";

/** « miamis » : une sortie des Miamis ; « idee » : une idée de la boîte */
export type CibleClocheCommunaute = "miamis" | "idee";
