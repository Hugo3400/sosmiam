import type { Langue } from "@sos-miam/commun/regles/langues";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

export function direDeLieuLangue(nom: string, langue: Langue): string {
  return langue === "en" ? `at ${nom}` : direDeLieu(nom);
}
