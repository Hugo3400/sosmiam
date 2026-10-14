/**
 * La liste des désinscrits (« adresse AAAA-MM-JJ » par ligne) gardée 3 ans (décidé par Hugo le 14 octobre 2026) : une seule
 * ligne par adresse, la plus récente, et plus rien de plus vieux que `limite` (« AAAA-MM-JJ »). Une ligne sans date valable
 * est gardée telle quelle (prudence : mieux vaut ne pas réécrire à quelqu'un qui est parti). Rend le texte et ce qui part.
 */
export function garderDesinscritsRecents(texte: string, limite: string): { texte: string; retires: number } {
  const parAdresse = new Map<string, string>();
  const sansDate: string[] = [];
  let lignes = 0;
  for (const ligne of texte.split("\n")) {
    const [adresse = "", date = ""] = ligne.trim().split(/\s+/);
    if (!adresse) continue;
    lignes++;
    const propre = adresse.toLowerCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      if (!parAdresse.has(propre)) sansDate.push(propre);
      continue;
    }
    if ((parAdresse.get(propre) ?? "") < date) parAdresse.set(propre, date);
  }
  const gardees = [
    ...sansDate.filter((adresse) => !parAdresse.has(adresse)).filter((adresse, i, toutes) => toutes.indexOf(adresse) === i),
    ...[...parAdresse].filter(([, date]) => date >= limite).map(([adresse, date]) => `${adresse} ${date}`),
  ];
  return { texte: gardees.length ? `${gardees.join("\n")}\n` : "", retires: lignes - gardees.length };
}
