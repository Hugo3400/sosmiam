import { calculerPlacesVille } from "./calculer-places-ville.ts";

/** Ce qu'il faut savoir d'une commune pour trouver sa zone : une commune du fichier des communes suffit. */
export type CommunePourZone = { code: string; codeDepartement: string; population: number };

/**
 * Code de la zone de fondateurs d'une commune (celui de ZoneFondateur) : son propre code INSEE si elle a 50 000 habitants
 * ou plus (zone « ville » : « 69123 » pour Lyon), sinon « D » suivi du code de son département ou de sa collectivité
 * d'outre-mer (« D69 », « D2A », « D987 »). Pour un arrondissement de Paris, Lyon ou Marseille, donne sa commune.
 */
export function calculerCodeZone(commune: CommunePourZone): string {
  return calculerPlacesVille(commune.population) > 0 ? commune.code : `D${commune.codeDepartement}`;
}
