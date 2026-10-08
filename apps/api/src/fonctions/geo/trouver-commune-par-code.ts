import { chargerIndexCommunes } from "./charger-index-communes.ts";
import type { CommuneIndexee, IndexCommunes } from "./indexer-communes.ts";

/**
 * La commune de ce code INSEE (« 69123 »), ou null s'il n'existe pas ou désigne une commune sans habitants. Le code d'un
 * arrondissement de Paris, Lyon ou Marseille (« 69383 ») donne sa commune. Sert à trouver la zone d'une candidature :
 * calculerCodeZone(commune), dans fonctions/fondateurs.
 */
export function trouverCommuneParCode(code: string, index: IndexCommunes = chargerIndexCommunes()): CommuneIndexee | null {
  return index.parCode.get(code) ?? null;
}
