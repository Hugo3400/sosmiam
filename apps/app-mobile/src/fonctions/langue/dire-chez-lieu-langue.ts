import type { Langue } from "@sos-miam/commun/regles/langues";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";

export function direChezLieuLangue(nom: string, langue: Langue): string {
  return langue === "en" ? `at ${nom}` : direChezLieu(nom);
}
