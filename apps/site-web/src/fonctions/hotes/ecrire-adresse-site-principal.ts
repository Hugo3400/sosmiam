import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { site } from "~/contenus/legal/informations-legales";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";

export function ecrireAdresseSitePrincipal(chemin: string, langue: Langue): string {
  const ecrit = ecrireCheminLangue(chemin, langue);
  return `https://${site.adresse}${ecrit === "/" ? "" : ecrit}`;
}
