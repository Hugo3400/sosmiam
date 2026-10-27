import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { PageLegale, TEXTES_PAGES_LEGALES } from "~/contenus/legal/liens-legaux";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";

type TextesPagesLegales = Traduction<typeof TEXTES_PAGES_LEGALES>;

const ORDRE: readonly [keyof TextesPagesLegales["pages"], string][] = [
  ["mentionsLegales", "/mentions-legales"],
  ["confidentialite", "/confidentialite"],
  ["cookies", "/cookies"],
  ["cgu", "/cgu"],
  ["accessibilite", "/accessibilite"],
  ["age", "/age"],
  ["prevention", "/prevention"],
  ["statistiques", "/statistiques"],
];

export function listerPagesLegales(textes: TextesPagesLegales, langue: Langue): PageLegale[] {
  return ORDRE.map(([cle, chemin]) => ({ ...textes.pages[cle], href: ecrireCheminLangue(chemin, langue) }));
}
