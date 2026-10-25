import { createContext, useContext } from "react";

import { LANGUE_PAR_DEFAUT, type Langue } from "@sos-miam/commun/regles/langues";
import type { ReglageLangue } from "~/contenus/type-langue";

export type EtatLangue = {
  langue: Langue;
  reglage: ReglageLangue;
  changerReglage: (reglage: ReglageLangue) => void;
};

export const ContexteLangue = createContext<EtatLangue>({ langue: LANGUE_PAR_DEFAUT, reglage: "automatique", changerReglage: () => undefined });

export function utiliserLangue(): EtatLangue {
  return useContext(ContexteLangue);
}
