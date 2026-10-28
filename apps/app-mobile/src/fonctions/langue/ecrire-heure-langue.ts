import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";

export function ecrireHeureLangue(instant: Date | string, langue: Langue): string {
  if (langue !== "en") return ecrireHeure(instant);
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
