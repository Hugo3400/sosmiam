import { utiliserTheme } from "~/hooks/utiliser-theme";

export function utiliserCouleursInterrupteur(): { piste: string; pastille: string } {
  const { schema, couleurs } = utiliserTheme();
  return schema === "sombre" ? { piste: couleurs.jaune, pastille: couleurs.nuit } : { piste: couleurs.encre, pastille: couleurs.jaune };
}
