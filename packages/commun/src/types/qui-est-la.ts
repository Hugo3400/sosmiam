import type { PersonneResume } from "./social.ts";

export type CoucouMiami = "aucun" | "envoye" | "recu" | "reciproque";

export type MiamiPresent = {
  personne: PersonneResume;
  dansTaBande: boolean;
  ambassadeur: boolean;
  nouveauDansLaVille: boolean;
  rescousses: number;
  titreBadge: string | null;
  organise: { sortieId: string; titre: string } | null;
  enviesEnCommun: string[];
  coucou: CoucouMiami;
};

export type EvenementMiamis = {
  id: string;
  auteur: PersonneResume | null;
  type: "idee-proposee" | "sortie-rejointe" | "reponse-brigade" | "votes-idees" | "sortie-organisee";
  titre: string;
  nombre: number;
  date: string;
};
