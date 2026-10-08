/** Estime le nombre d'empreintes différentes ajoutées à une esquisse HyperLogLog (voir ajouterAEsquisse). */
export function estimerEsquisse(esquisse: Uint8Array): number {
  const m = esquisse.length;
  let somme = 0;
  let registresVides = 0;
  for (const registre of esquisse) {
    somme += 2 ** -registre;
    if (registre === 0) registresVides++;
  }
  const estimation = ((0.7213 / (1 + 1.079 / m)) * m * m) / somme;
  // Petits nombres : le comptage des registres vides est bien plus juste (presque exact sous quelques centaines)
  if (estimation <= 2.5 * m && registresVides > 0) return Math.round(m * Math.log(m / registresVides));
  return Math.round(estimation);
}
