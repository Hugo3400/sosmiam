// L'espace communauté tel que l'API le rend (routes /app/communaute, décision de Hugo des 14 et 15 octobre 2026) : sorties
// des Miamis, « Qui est là ? », mon genre, boîte à idées et « Ça bouge chez les Miamis ». Les formes de base viennent des
// écrans (sorties-miamis.ts, idees.ts, qui-est-la.ts, genre.ts) ; ce fichier n'ajoute que ce que l'API y met de plus.
import type { CommentaireIdee, IdeeMiamis } from "./idees.ts";
import type { MiamiPresent } from "./qui-est-la.ts";
import type { SortieMiamis } from "./sorties-miamis.ts";

/** Une sortie des Miamis lue par l'API : sa version, et l'invitation des habitués qui t'attend */
export type SortieMiamisApi = SortieMiamis & {
  /** Monte à chaque changement que voient les participants */
  version: number;
  /** Habitué de la semaine passée : ta place est gardée jusqu'à cette date, « Je viens » te fait entrer sans attendre */
  invitationHabitue: { jusqua: string } | null;
};

/**
 * « Qui est là ? » : les Miamis de ta ville qui ont choisi de s'y montrer, en ce moment. D'une personne, seulement son pseudo
 * et son avatar (décision du 14 octobre 2026) : ambassadeur, nouveauDansLaVille, rescousses, titreBadge et enviesEnCommun
 * valent toujours false, 0, null ou [] ; dansTaBande, coucou et organise (une sortie que tu peux voir) sont remplis.
 */
export type QuiEstLaApi = {
  /** La ville de ton profil ; null : pas de ville, personne à montrer */
  ville: string | null;
  /** Ton réglage « Me montrer ici » */
  visible: boolean;
  /** Ta présence s'efface toute seule à cette date (null : tu n'y es pas en ce moment) */
  jusqua: string | null;
  /** Combien s'y montrent en ce moment (toi exclu·e, blocages exclus) */
  total: number;
  presents: MiamiPresent[];
};

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
