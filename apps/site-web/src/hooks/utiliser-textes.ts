import { choisirTextes } from "../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { ParLangue } from "../../../../packages/commun/src/types/traduction.ts";
import { utiliserLangue } from "~/hooks/utiliser-langue";

export function utiliserTextes<T>(paire: ParLangue<T>): T {
  return choisirTextes(paire, utiliserLangue());
}
