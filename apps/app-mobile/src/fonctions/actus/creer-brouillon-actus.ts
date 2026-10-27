import type { RubriqueActus } from "@sos-miam/commun/regles/actus";
import type { BrouillonActusSaisi } from "~/contenus/type-brouillon-actus";

export function creerBrouillonActus(rubrique: RubriqueActus): BrouillonActusSaisi {
  return { rubrique, titre: "", accroche: "", texte: "", citation: "", couverture: null, photos: [], lieux: [], collaboration: null, finSaisie: "" };
}
