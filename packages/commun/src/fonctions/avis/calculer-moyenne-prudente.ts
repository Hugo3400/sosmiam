import { MOYENNE_A_PRIORI, MOYENNE_POIDS } from "../../regles/avis.ts";

/**
 * Moyenne prudente des notes d'un lieu : (poids × aPriori + somme des notes) / (poids + nombre de notes). Avec peu
 * d'avis, elle reste proche de 4 ; elle rejoint la vraie moyenne à mesure que les avis arrivent. Sans note : null.
 */
export function calculerMoyennePrudente(
  notes: readonly number[],
  aPriori: number = MOYENNE_A_PRIORI,
  poids: number = MOYENNE_POIDS,
): number | null {
  const valables = notes.filter((note) => Number.isFinite(note));
  if (valables.length === 0) return null;
  const somme = valables.reduce((total, note) => total + note, 0);
  return (poids * aPriori + somme) / (poids + valables.length);
}
