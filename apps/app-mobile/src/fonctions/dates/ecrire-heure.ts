import { formaterHeure } from "~/fonctions/dates/formater-heure";

/** L'heure d'un instant, à la française : « 21h », « 22h30 » (heure du téléphone). */
export function ecrireHeure(instant: Date | string): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return formaterHeure(`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);
}
