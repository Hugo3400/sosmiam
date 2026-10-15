import type { CommentaireIdee, IdeeMiamis } from "./idees.ts";
import type { MiamiPresent } from "./qui-est-la.ts";
import type { SortieMiamis } from "./sorties-miamis.ts";

export type SortieMiamisApi = SortieMiamis & {
  version: number;
  invitationHabitue: { jusqua: string } | null;
};

export type QuiEstLaApi = {
  ville: string | null;
  visible: boolean;
  jusqua: string | null;
  total: number;
  presents: MiamiPresent[];
};

export type IdeeDetailApi = { idee: IdeeMiamis; commentaires: CommentaireIdee[] };

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

export type CibleClocheCommunaute = "miamis" | "idee";
