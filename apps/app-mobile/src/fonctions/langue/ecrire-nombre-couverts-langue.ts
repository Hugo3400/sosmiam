import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireNombreCouverts } from "~/fonctions/reservations/ecrire-nombre-couverts";

export function ecrireNombreCouvertsLangue(couverts: number, langue: Langue): string {
  return langue === "en" ? `${couverts} cover${couverts === 1 ? "" : "s"}` : ecrireNombreCouverts(couverts);
}
