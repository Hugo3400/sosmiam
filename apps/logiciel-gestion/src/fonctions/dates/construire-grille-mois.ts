/** Une date locale en « AAAA-MM-JJ » (heure de ce PC) */
export const jourLocal = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Les semaines d'un mois pour un calendrier (lundi d'abord) : chaque case est un jour « AAAA-MM-JJ », avec les jours
 * du mois d'avant et d'après pour compléter la première et la dernière semaine.
 */
export function construireGrilleMois(annee: number, mois: number): string[][] {
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7; // lundi = 0
  const debut = new Date(annee, mois, 1 - decalage);
  const semaines: string[][] = [];
  for (let s = 0; s < 6; s++) {
    const semaine = Array.from({ length: 7 }, (_, j) => jourLocal(new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + s * 7 + j)));
    // Une sixième semaine entièrement dans le mois suivant n'est pas affichée
    if (s > 3 && Number(semaine[0]!.slice(5, 7)) !== mois + 1) break;
    semaines.push(semaine);
  }
  return semaines;
}
