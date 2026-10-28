import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { formaterHeure } from "~/fonctions/dates/formater-heure";

export function formaterHeureTexteLangue(heure: string, langue: Langue): string {
  if (langue !== "en") return formaterHeure(heure);
  const [heures, minutes] = heure.split(":");
  return formaterHeureLangue(Number(heures), Number(minutes), langue);
}
