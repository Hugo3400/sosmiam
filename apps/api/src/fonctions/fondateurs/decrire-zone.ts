export type TypeZone = "ville" | "departement";

/**
 * Une zone et ses places, telle que l'API la montre : `prises` compte les fondateurs en place (candidatures « acceptee » ;
 * un fondateur « souvenir », parti de sa zone, n'en prend plus), `libres` = places − prises, jamais moins de 0.
 */
export type ZoneVue = { code: string; type: TypeZone; nom: string; nomAvecDe: string; places: number; prises: number; libres: number };

/** Ce qu'il faut d'une zone (ligne de ZoneFondateur, ou zone préparée) pour la décrire */
export type ZoneADecrire = { code: string; type: string; nom: string; nomAvecDe: string; places: number };

/** La vue d'une zone, ses places prises connues (le reste de la ligne, population ou prochain numéro, n'est pas montré). */
export function decrireZone({ code, type, nom, nomAvecDe, places }: ZoneADecrire, prises: number): ZoneVue {
  return { code, type: type === "ville" ? "ville" : "departement", nom, nomAvecDe, places, prises, libres: Math.max(0, places - prises) };
}
