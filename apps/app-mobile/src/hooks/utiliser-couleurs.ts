import { utiliserTheme, type Palette } from "~/hooks/utiliser-theme";

export function utiliserCouleurs(): Palette {
  return utiliserTheme().couleurs;
}
