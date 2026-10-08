/**
 * Grille jours × heures à partir des créneaux comptés (« 4-21 » : jeudi, 21 h) : 7 lignes (lundi → dimanche) de 24 cases.
 * Rend aussi le plus grand nombre, pour l'échelle des couleurs.
 */
export function construireGrilleCreneaux(creneaux: { valeur: string; nombre: number }[]): { grille: number[][]; maximum: number } {
  const grille = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const { valeur, nombre } of creneaux) {
    const [jour, heure] = valeur.split("-").map(Number);
    if (jour && jour >= 1 && jour <= 7 && heure !== undefined && heure >= 0 && heure <= 23) grille[jour - 1]![heure]! += nombre;
  }
  return { grille, maximum: Math.max(0, ...grille.flat()) };
}
