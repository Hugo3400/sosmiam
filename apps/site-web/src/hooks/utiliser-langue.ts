import { createContext, use } from "react";

import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../packages/commun/src/regles/langues.ts";

export type LangueDuSite = { langue: Langue; servies: readonly Langue[] };

export const ContexteLangue = createContext<LangueDuSite>({ langue: LANGUE_PAR_DEFAUT, servies: [LANGUE_PAR_DEFAUT] });

export function utiliserLangue(): Langue {
  return use(ContexteLangue).langue;
}

export function utiliserLanguesServies(): readonly Langue[] {
  return use(ContexteLangue).servies;
}
