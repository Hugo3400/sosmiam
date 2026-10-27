import { RUBRIQUES_ACTUS, type RubriqueActus } from "../../../../../packages/commun/src/regles/actus.ts";
import type { FiltresActus } from "../../types/actus.ts";
import { ecrireIdentifiantVille } from "../page-lieux/ecrire-identifiant-ville.ts";

const VILLE_MAX = 80;
const CURSEUR = /^\d{1,15}\.\d{1,9}$/;

const estRubrique = (valeur: string): valeur is RubriqueActus => (RUBRIQUES_ACTUS as readonly string[]).includes(valeur);

export function lireFiltresActus(parametres: URLSearchParams): FiltresActus {
  const rubrique = parametres.get("rubrique") ?? "";
  const ville = ecrireIdentifiantVille((parametres.get("ville") ?? "").slice(0, VILLE_MAX));
  const curseur = parametres.get("curseur") ?? "";
  return { rubrique: estRubrique(rubrique) ? rubrique : null, ville: ville || null, curseur: CURSEUR.test(curseur) ? curseur : null };
}
