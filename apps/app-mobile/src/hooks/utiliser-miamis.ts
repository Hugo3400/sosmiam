import { createContext, useContext } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { RefusEtiquetteLibre } from "@sos-miam/commun/types/etiquette";
import type { ChoixGenre, GenreProfil } from "@sos-miam/commun/types/genre";
import type { CommentaireIdee, IdeeMiamis, NouvelleIdee } from "@sos-miam/commun/types/idees";
import type { MessageSortie } from "@sos-miam/commun/types/potes";
import type { EvenementMiamis, MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import type { NouvelleSortieMiamis, ProfilVisibiliteMiamis, SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import type { ChampNouvelleSortieMiamis } from "@sos-miam/commun/validation/valider-nouvelle-sortie-miamis";
import type { ResultatTexte } from "~/hooks/utiliser-communaute";
import type { ResultatEnvoiChat } from "~/hooks/utiliser-conversations";

export type ResultatGesteMiamis = ErreurService | "reseau" | null;

export type ErreurNouvelleSortieMiamis = {
  erreur: ChampNouvelleSortieMiamis | "compte-limite" | "reseau";
  raison?: "mot-interdit" | RefusEtiquetteLibre;
};

export type ErreurNouvelleIdee = { erreur: "titre" | "detail" | "compte-limite" | "reseau"; raison?: "vide" | "trop-court" | "trop-long" | "mot-interdit" };

export type ResultatCommentaireIdee = ResultatTexte | "compte-limite" | "reseau";

export type ResultatGenre = { ok: true } | { ok: false; prochain: string } | { ok: false; erreur: ErreurService | "reseau" };

export type EtatSortiesMiamis = {
  sorties: SortieMiamis[];
  trouverSortie: (id: string) => SortieMiamis | null;
  creerSortie: (sortie: NouvelleSortieMiamis) => Promise<{ id: string } | ErreurNouvelleSortieMiamis>;
  demanderAVenir: (id: string) => Promise<ResultatGesteMiamis>;
  annulerDemande: (id: string) => Promise<ResultatGesteMiamis>;
  nePlusVenir: (id: string) => Promise<ResultatGesteMiamis>;
  accepterArrivee: (sortieId: string, personneId: string) => Promise<ResultatGesteMiamis>;
  refuserArrivee: (sortieId: string, personneId: string) => Promise<ResultatGesteMiamis>;
  validerPresence: (id: string) => Promise<ResultatGesteMiamis>;
  annulerSortie: (id: string) => Promise<ResultatGesteMiamis>;
  messagesDe: (id: string) => MessageSortie[];
  envoyerMessage: (id: string, texte: string) => ResultatEnvoiChat;
};

export type EtatIdeesMiamis = {
  idees: IdeeMiamis[];
  trouverIdee: (id: string) => IdeeMiamis | null;
  ideeDuMois: IdeeMiamis | null;
  voterIdee: (id: string) => void;
  proposerIdee: (idee: NouvelleIdee) => Promise<{ id: string } | ErreurNouvelleIdee>;
  commentairesDe: (ideeId: string) => CommentaireIdee[];
  commenterIdee: (ideeId: string, texte: string, reponseA: string | null) => Promise<ResultatCommentaireIdee>;
  aimerCommentaire: (id: string) => void;
};

export type EtatQuiEstLa = {
  presents: MiamiPresent[];
  visible: boolean;
  choisirVisibilite: (visible: boolean) => Promise<ResultatGesteMiamis>;
  envoyerCoucou: (personneId: string) => Promise<ResultatGesteMiamis>;
  demanderBande: (personneId: string) => Promise<ResultatGesteMiamis>;
  bandeDemandee: (personneId: string) => boolean;
};

export type EtatReglagesMiamis = {
  genre: GenreProfil;
  choisirGenre: (choix: ChoixGenre) => Promise<ResultatGenre>;
  envies: string[];
  modifierEnvies: (envies: string[]) => void;
  profilVisibilite: ProfilVisibiliteMiamis;
};

export type EtatMiamis = EtatSortiesMiamis &
  EtatIdeesMiamis &
  EtatQuiEstLa &
  EtatReglagesMiamis & {
    disponible: boolean;
    ville: string;
    moi: PersonneResume;
    fil: EvenementMiamis[];
  };

export const ContexteMiamis = createContext<EtatMiamis | null>(null);

export function utiliserMiamis(): EtatMiamis {
  const etat = useContext(ContexteMiamis);
  if (!etat) throw new Error("utiliserMiamis doit être appelé sous <FournisseurMiamis>.");
  return etat;
}
