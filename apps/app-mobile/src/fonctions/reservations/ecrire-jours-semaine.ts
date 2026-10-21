const NOMS_JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const ORDRE_SEMAINE = [1, 2, 3, 4, 5, 6, 0];

const mettreMajuscule = (texte: string) => texte.charAt(0).toLocaleUpperCase("fr-FR") + texte.slice(1);

function enumerer(noms: readonly string[]): string {
  return noms.length === 1 ? noms[0]! : `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}

function lireSuiteCirculaire(choisis: ReadonlySet<number>): { debut: number; fin: number } | null {
  const positions = ORDRE_SEMAINE.map((jour) => choisis.has(jour));
  const debuts = positions.flatMap((dedans, i) => (dedans && !positions[(i + 6) % 7] ? [i] : []));
  if (debuts.length !== 1) return null;
  let fin = debuts[0]!;
  while (positions[(fin + 1) % 7]) fin = (fin + 1) % 7;
  return { debut: ORDRE_SEMAINE[debuts[0]!]!, fin: ORDRE_SEMAINE[fin]! };
}

export function ecrireJoursSemaine(jours: readonly number[]): string {
  const choisis = new Set(jours.filter((jour) => ORDRE_SEMAINE.includes(jour)));
  const ordonnes = ORDRE_SEMAINE.filter((jour) => choisis.has(jour));
  if (ordonnes.length === 0) return "Aucun jour";
  if (ordonnes.length === 7) return "Tous les jours";
  if (ordonnes.length === 6) return `Tous les jours sauf le ${NOMS_JOURS[ORDRE_SEMAINE.find((jour) => !choisis.has(jour)) ?? 0]}`;
  if (ordonnes.length === 1) return `Le ${NOMS_JOURS[ordonnes[0]!]}`;
  const suite = ordonnes.length >= 3 ? lireSuiteCirculaire(choisis) : null;
  if (suite) return `Du ${NOMS_JOURS[suite.debut]} au ${NOMS_JOURS[suite.fin]}`;
  return mettreMajuscule(enumerer(ordonnes.map((jour) => NOMS_JOURS[jour]!)));
}
