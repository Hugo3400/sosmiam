import { formaterHeureLangue } from "../../../../../packages/commun/src/fonctions/langue/formater-heure-langue.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { ecrireDateAParisLangue } from "./ecrire-date-a-paris-langue.ts";
import { formaterMomentAParis } from "./formater-moment-a-paris.ts";

const HEURE_PARIS = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function ecrireMomentAParisLangue(moment: string, langue: Langue): string | null {
  if (langue === "fr") return formaterMomentAParis(moment);
  const jour = ecrireDateAParisLangue(moment, langue);
  const date = new Date(moment);
  if (!jour || Number.isNaN(date.getTime())) return null;
  const [heures, minutes] = HEURE_PARIS.format(date).split(":").map(Number);
  return `${jour} at ${formaterHeureLangue(heures, minutes, langue)}`;
}
