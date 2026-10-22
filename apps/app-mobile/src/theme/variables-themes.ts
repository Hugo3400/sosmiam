import { vars } from "nativewind";

import { creerVariablesPalette } from "~/fonctions/theme/creer-variables-palette";
import palettes from "~/theme/palettes";

export const VARIABLES_CSS = { clair: creerVariablesPalette(palettes.clair), sombre: creerVariablesPalette(palettes.sombre) };

export const VARIABLES_THEMES = { clair: vars(VARIABLES_CSS.clair), sombre: vars(VARIABLES_CSS.sombre) };
