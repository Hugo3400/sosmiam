import type { Langue } from "@sos-miam/commun/regles/langues";
import { ecrireMomentLong } from "~/fonctions/dates/ecrire-moment-long";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";

function ecrireHeureAnglaise(date: Date): string {
  if (date.getMinutes() === 0 && date.getHours() === 0) return "midnight";
  if (date.getMinutes() === 0 && date.getHours() === 12) return "midday";
  return ecrireHeureLangue(date, "en");
}

export function ecrireMomentLongLangue(iso: string | null | undefined, langue: Langue): string | null {
  if (langue !== "en") return ecrireMomentLong(iso);
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${ecrireDateLongueLangue(formaterDateIso(date), langue)} at ${ecrireHeureAnglaise(date)}`;
}
