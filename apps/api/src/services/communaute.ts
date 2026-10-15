import { creerChiffrementGenre } from "./chiffrement-communaute.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import { creerFil } from "./communaute-fil.ts";
import { creerGenre } from "./communaute-genre.ts";
import { creerIdees } from "./communaute-idees.ts";
import { creerQuiEstLa } from "./communaute-qui-est-la.ts";
import type { ContexteCommunaute, DepotCommunaute, ServicesCommunaute } from "./communaute-regles.ts";
import { creerLectureSortiesMiamis } from "./communaute-sorties-lecture.ts";
import { creerSortiesMiamis } from "./communaute-sorties.ts";
import type { ServicesLimitations } from "./limitations-comptes-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";

export type OptionsCommunaute = {
  depot: DepotCommunaute;
  relations: RelationsSociales;
  chiffrementDonnees: ChiffrementDonnees | null;
  estLimite?: ServicesLimitations["estLimite"];
};

export function creerCommunaute(o: OptionsCommunaute): ServicesCommunaute {
  const c: ContexteCommunaute = { ...o, genre: creerChiffrementGenre(o.chiffrementDonnees) };
  const lecture = creerLectureSortiesMiamis(c);
  return {
    sorties: creerSortiesMiamis(c),
    genre: creerGenre(c),
    quiEstLa: creerQuiEstLa(c, lecture),
    idees: creerIdees(c),
    fil: creerFil(c, lecture),
  };
}
