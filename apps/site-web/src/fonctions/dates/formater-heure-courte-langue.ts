import { formaterHeureLangue } from "../../../../../packages/commun/src/fonctions/langue/formater-heure-langue.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";

export function formaterHeureCourteLangue(heure: string, langue: Langue): string | null {
  const morceaux = /^(\d{1,2}):(\d{2})$/.exec(heure.trim());
  if (!morceaux) return null;
  const [heures, minutes] = [Number(morceaux[1]), Number(morceaux[2])];
  if (heures > 24 || minutes > 59) return null;
  return formaterHeureLangue(heures % 24, minutes, langue);
}
