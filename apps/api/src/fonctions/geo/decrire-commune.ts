import type { IndexCommunes } from "./indexer-communes.ts";
import { trouverCommuneParCode } from "./trouver-commune-par-code.ts";

/** Une commune telle que l'API la montre */
export type CommuneVue = { code: string; nom: string; nomDepartement: string; codeDepartement: string; population: number };

/**
 * La commune de ce code INSEE, sous la forme que montre l'API, ou null si elle est inconnue. Le code d'un arrondissement
 * de Paris, Lyon ou Marseille (« 69383 ») donne sa commune (« 69123 », Lyon).
 */
export function decrireCommune(code: string, index?: IndexCommunes): CommuneVue | null {
  const commune = trouverCommuneParCode(code, index);
  if (!commune) return null;
  const { nom, nomDepartement, codeDepartement, population } = commune;
  return { code: commune.code, nom, nomDepartement, codeDepartement, population };
}
