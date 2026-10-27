import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { lireLangue } from "../../../../../packages/commun/src/fonctions/langue/lire-langue.ts";

type CorrespondanceMeta = { id: string; loaderData?: unknown };

export function lireLangueMeta(correspondances: readonly CorrespondanceMeta[] | undefined): Langue {
  const racine = correspondances?.find((correspondance) => correspondance.id === "root")?.loaderData;
  const langue = racine && typeof racine === "object" && "langue" in racine ? lireLangue(racine.langue) : null;
  return langue ?? LANGUE_PAR_DEFAUT;
}
