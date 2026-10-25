import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { ParLangue } from "@sos-miam/commun/types/traduction";
import { utiliserLangue } from "~/hooks/utiliser-langue";

export function utiliserTextes<T>(paire: ParLangue<T>): T {
  return choisirTextes(paire, utiliserLangue().langue);
}
