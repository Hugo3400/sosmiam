import type { Langue } from "@sos-miam/commun/regles/langues";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";

export function formaterNombreCourtLangue(nombre: number, langue: Langue): string {
  if (langue !== "en") return formaterNombreCourt(nombre);
  if (nombre < 1000) return String(nombre);
  const milliers = nombre / 1000;
  return `${milliers < 10 ? milliers.toFixed(1).replace(".0", "") : Math.round(milliers)}k`;
}
