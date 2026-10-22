import { createContext, useContext } from "react";

import type { ReglageApparence, SchemaCouleurs } from "~/contenus/type-apparence";
import couleursClaires from "~/theme/couleurs";

export type Palette = typeof couleursClaires;

export type EtatTheme = {
  schema: SchemaCouleurs;
  reglage: ReglageApparence;
  couleurs: Palette;
  changerReglage: (reglage: ReglageApparence) => void;
};

export const ContexteTheme = createContext<EtatTheme>({ schema: "clair", reglage: "automatique", couleurs: couleursClaires, changerReglage: () => undefined });

export function utiliserTheme(): EtatTheme {
  return useContext(ContexteTheme);
}
