import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import type { Publication } from "~/contenus/type-publication";
import { calculerScoreLieu } from "~/fonctions/lieux/calculer-score-lieu";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";

/**
 * Ordre du fil « Pour toi » : d'abord ce que la personne suit (le lieu ou le créateur qui publie, ou un lieu suivi dont on parle),
 * puis les publications des lieux qui lui plaisent le plus, sans jamais deux publications du même lieu à la suite.
 * Ignore celles dont le lieu n'est pas dans la liste (âge). `suivis` : clés de calculerCleSuivi.
 */
export function ordonnerPublications(publications: Publication[], lieux: Lieu[], profil: Profil | null, suivis: readonly string[] = []): Publication[] {
  const parId = new Map(lieux.map((lieu) => [lieu.id, lieu]));
  const cles = new Set(suivis);
  const score = (p: Publication) => {
    const lieu = parId.get(p.lieuId);
    return lieu && profil ? calculerScoreLieu(lieu, profil) : 0;
  };
  const suivie = (p: Publication) => Number(cles.has(calculerCleSuivi(p.auteur, p.lieuId)) || cles.has(calculerCleSuivi({ type: "lieu" }, p.lieuId)));
  const restantes = publications.filter((p) => parId.has(p.lieuId)).sort((a, b) => suivie(b) - suivie(a) || score(b) - score(a));
  const ordre: Publication[] = [];
  // À chaque place, la mieux classée qui ne parle pas du même lieu que la précédente (s'il n'en reste pas, tant pis)
  while (restantes.length > 0) {
    const precedent = ordre.at(-1)?.lieuId;
    const index = restantes.findIndex((p) => p.lieuId !== precedent);
    ordre.push(restantes.splice(index === -1 ? 0 : index, 1)[0]);
  }
  return ordre;
}
