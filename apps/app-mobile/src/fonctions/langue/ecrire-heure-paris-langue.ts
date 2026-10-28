import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import { calculerDecalageParis } from "@sos-miam/commun/fonctions/temps/calculer-decalage-paris";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";

export function ecrireHeureParisLangue(instant: Date | string, langue: Langue): string {
  if (langue !== "en") return ecrireHeureParis(instant);
  const ms = typeof instant === "string" ? Date.parse(instant) : instant.getTime();
  if (Number.isNaN(ms)) return "";
  const aParis = new Date(ms + calculerDecalageParis(ms));
  return formaterHeureLangue(aParis.getUTCHours(), aParis.getUTCMinutes(), langue);
}
