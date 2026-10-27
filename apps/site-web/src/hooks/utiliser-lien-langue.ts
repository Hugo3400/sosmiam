import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";

export function utiliserLienLangue(): (chemin: string) => string {
  const langue = utiliserLangue();
  return (chemin) => ecrireCheminLangue(chemin, langue);
}
