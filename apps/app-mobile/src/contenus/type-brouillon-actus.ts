import type { RubriqueActus } from "@sos-miam/commun/regles/actus";

export type BrouillonActusSaisi = {
  rubrique: RubriqueActus;
  titre: string;
  accroche: string;
  texte: string;
  citation: string;
  couverture: string | null;
  photos: string[];
  lieux: number[];
  collaboration: boolean | null;
  finSaisie: string;
};
