import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import type { Publication } from "~/contenus/type-publication";
import { calculerScoreLieu } from "~/fonctions/lieux/calculer-score-lieu";
import { estimerKmPourClasser } from "~/fonctions/lieux/estimer-km-pour-classer";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";

/**
 * Ordre du fil « Pour toi » : d'abord ce que la personne suit (le lieu ou le créateur qui publie, ou un lieu suivi dont on parle),
 * puis les publications des lieux qui lui plaisent le plus, sans jamais deux publications du même lieu à la suite.
 * Ignore celles dont le lieu n'est pas dans la liste (âge). `suivis` : clés de calculerCleSuivi. `depart` : le centre de ta
 * ville (null si on ne la connaît pas), pour classer un lieu pas encore placé au centre de la sienne.
 */
export function ordonnerPublications(
  publications: Publication[],
  lieux: Lieu[],
  profil: Profil | null,
  suivis: readonly string[] = [],
  depart: PositionLieu | null = null,
): Publication[] {
  const parId = new Map(lieux.map((lieu) => [lieu.id, lieu]));
  const cles = new Set(suivis);
  // Un score par lieu, calculé une fois : depuis ta ville (ou la distance d'exemple en démo) ; un lieu pas encore placé :
  // au centre de sa ville
  const scores = new Map(profil ? lieux.map((lieu) => [lieu.id, calculerScoreLieu(lieu, profil, estimerKmPourClasser(lieu, depart))]) : []);
  const score = (p: Publication) => scores.get(p.lieuId) ?? 0;
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
