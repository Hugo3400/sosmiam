import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import type { Publication } from "~/contenus/type-publication";
import { calculerScoreLieu } from "~/fonctions/lieux/calculer-score-lieu";

/**
 * Ordre du fil « Pour toi » : les publications des lieux qui plaisent le plus à la personne d'abord,
 * sans jamais deux publications du même lieu à la suite. Ignore celles dont le lieu n'est pas dans la liste (âge).
 */
export function ordonnerPublications(publications: Publication[], lieux: Lieu[], profil: Profil | null): Publication[] {
  const parId = new Map(lieux.map((lieu) => [lieu.id, lieu]));
  const score = (p: Publication) => {
    const lieu = parId.get(p.lieuId);
    return lieu && profil ? calculerScoreLieu(lieu, profil) : 0;
  };
  const restantes = publications.filter((p) => parId.has(p.lieuId)).sort((a, b) => score(b) - score(a));
  const ordre: Publication[] = [];
  while (restantes.length > 0) {
    const precedent = ordre.at(-1)?.lieuId;
    const index = restantes.findIndex((p) => p.lieuId !== precedent);
    ordre.push(restantes.splice(index === -1 ? 0 : index, 1)[0]);
  }
  return ordre;
}
