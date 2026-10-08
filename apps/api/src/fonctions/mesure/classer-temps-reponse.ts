/** Tranche de temps de réponse du serveur, pour la répartition (« < 100 ms », « 100–300 ms »…). */
export function classerTempsReponse(millisecondes: number): string {
  if (millisecondes < 100) return "< 100 ms";
  if (millisecondes < 300) return "100–300 ms";
  if (millisecondes < 1000) return "300 ms–1 s";
  return "> 1 s";
}
