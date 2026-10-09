/** Une version de l'app « majeure.mineure.correctif » (« 1.4.0 ») ; autre chose (vide, mal écrit) : `defaut`. */
export function lireVersionApp(valeur: unknown, defaut = "0.0.0"): string {
  const propre = typeof valeur === "string" ? valeur.trim() : "";
  return /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(propre) ? propre : defaut;
}
