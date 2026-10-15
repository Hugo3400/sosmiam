import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";

/** Un instant en toutes lettres, à l'heure du téléphone : « 22 octobre 2026 à 12h » ; null si absent ou illisible. */
export function ecrireMomentLong(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${formaterDateLongue(formaterDateIso(date))} à ${ecrireHeure(date)}`;
}
