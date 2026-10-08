/** Graduations rondes d'un axe, de 0 jusqu'au-dessus du maximum (0, 5, 10, 15 ; 0, 200, 400…). */
export function calculerGraduations(maximum: number, nombreVise = 4): number[] {
  if (maximum <= 0) return [0, 1];
  const brut = maximum / nombreVise;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((facteur) => facteur * puissance).find((candidat) => candidat >= brut) ?? 10 * puissance;
  const pasEntier = Math.max(1, pas);
  const graduations: number[] = [];
  for (let valeur = 0; valeur < maximum + pasEntier; valeur += pasEntier) graduations.push(Math.round(valeur * 100) / 100);
  return graduations;
}
