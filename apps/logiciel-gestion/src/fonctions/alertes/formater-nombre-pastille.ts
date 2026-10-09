/** Le nombre d'une pastille du menu : 1 à 9 tel quel, « +9 » au-delà (choix de Hugo, 9 octobre 2026). */
export function formaterNombrePastille(nombre: number): string {
  return nombre > 9 ? "+9" : String(nombre);
}
