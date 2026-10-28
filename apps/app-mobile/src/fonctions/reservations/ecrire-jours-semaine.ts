import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { JOURS_SEMAINE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client-dates";

const ORDRE_SEMAINE = [1, 2, 3, 4, 5, 6, 0];

const mettreMajuscule = (texte: string) => texte.charAt(0).toLocaleUpperCase("fr-FR") + texte.slice(1);

function lireSuiteCirculaire(choisis: ReadonlySet<number>): { debut: number; fin: number } | null {
  const positions = ORDRE_SEMAINE.map((jour) => choisis.has(jour));
  const debuts = positions.flatMap((dedans, i) => (dedans && !positions[(i + 6) % 7] ? [i] : []));
  if (debuts.length !== 1) return null;
  let fin = debuts[0]!;
  while (positions[(fin + 1) % 7]) fin = (fin + 1) % 7;
  return { debut: ORDRE_SEMAINE[debuts[0]!]!, fin: ORDRE_SEMAINE[fin]! };
}

export function ecrireJoursSemaine(jours: readonly number[], langue: Langue): string {
  const T = choisirTextes(JOURS_SEMAINE_RESERVATION_PAR_LANGUE, langue);
  const noms = CALENDRIER_PAR_LANGUE[langue].jours;
  const choisis = new Set(jours.filter((jour) => ORDRE_SEMAINE.includes(jour)));
  const ordonnes = ORDRE_SEMAINE.filter((jour) => choisis.has(jour));
  if (ordonnes.length === 0) return T.aucun;
  if (ordonnes.length === 7) return T.tous;
  if (ordonnes.length === 6) return T.sauf(noms[ORDRE_SEMAINE.find((jour) => !choisis.has(jour)) ?? 0]!);
  if (ordonnes.length === 1) return T.un(noms[ordonnes[0]!]!);
  const suite = ordonnes.length >= 3 ? lireSuiteCirculaire(choisis) : null;
  if (suite) return T.suite(noms[suite.debut]!, noms[suite.fin]!);
  return mettreMajuscule(T.liste(ordonnes.map((jour) => noms[jour]!)));
}
