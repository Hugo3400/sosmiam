import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";

export function ecrireAdresseEspaceAmbassadeur(langue: Langue): string {
  const chemin = ecrireCheminLangue("/", langue);
  return chemin === "/" ? adresseEspaceAmbassadeur : `${adresseEspaceAmbassadeur}${chemin}`;
}
