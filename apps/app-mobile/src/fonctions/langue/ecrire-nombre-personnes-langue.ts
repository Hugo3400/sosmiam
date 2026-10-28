import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";

export function ecrireNombrePersonnesLangue(personnes: number, langue: Langue): string {
  return langue === "en" ? `${personnes} ${personnes === 1 ? "person" : "people"}` : ecrireNombrePersonnes(personnes);
}
