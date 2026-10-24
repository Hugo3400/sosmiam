import { LANGUE_PAR_DEFAUT, type Langue } from "../../regles/langues.ts";
import type { ParLangue } from "../../types/traduction.ts";

export function choisirTextes<T>(paire: ParLangue<T>, langue: Langue): T {
  return paire[langue] ?? paire[LANGUE_PAR_DEFAUT];
}
