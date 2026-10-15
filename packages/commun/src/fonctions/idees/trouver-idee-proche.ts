const MOTS_SANS_POIDS = new Set([
  "pour", "dans", "avec", "sans", "plus", "moins", "comme", "mais", "quand", "tout", "tous", "toute", "toutes", "leur", "leurs",
  "sont", "cette", "votre", "notre", "entre", "apres", "avant", "chez", "faire", "avoir", "etre", "pouvoir", "encore", "aussi",
  "ville", "appli", "application", "miam", "miamis", "genre", "truc", "chose", "serait", "peut", "faut", "voudrais", "aimerais",
]);

function extraireRacines(texte: string): Set<string> {
  const mots = texte
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr")
    .split(/[^\p{L}\p{N}€]+/u)
    .filter((mot) => mot === "€" || (mot.length >= 4 && !MOTS_SANS_POIDS.has(mot)));
  return new Set(mots.map((mot) => mot.slice(0, 5)));
}

export function trouverIdeeProche<T extends { titre: string; detail: string; votes: number }>(texte: string, idees: readonly T[]): T | null {
  const racines = extraireRacines(texte);
  if (racines.size === 0) return null;
  let meilleure: T | null = null;
  let meilleurScore = 0;
  for (const idee of idees) {
    const cibles = extraireRacines(`${idee.titre} ${idee.detail}`);
    const communes = [...racines].filter((r) => cibles.has(r)).length;
    const assez = communes >= 2 || (communes >= 1 && racines.size <= 2);
    if (!assez) continue;
    if (communes > meilleurScore || (communes === meilleurScore && meilleure !== null && idee.votes > meilleure.votes)) {
      meilleure = idee;
      meilleurScore = communes;
    }
  }
  return meilleure;
}
